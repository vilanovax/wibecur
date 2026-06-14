import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { revalidateAdminCommentsCache } from '@/lib/admin/admin-cache';
import {
  getPenaltyThresholds,
  getUserPenaltyScore,
} from '@/lib/comment-permission';
import { notifyCommentRestriction } from '@/lib/comment-restriction-notify';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';

type RestrictionAction = 'restrict' | 'unrestrict' | 'ban';

// GET /api/admin/comments/violations/user/[userId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const [user, totalPenaltyScore, penalties, violationRows, thresholds] =
      await Promise.all([
        dbQuery(() =>
          prisma.users.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              isActive: true,
              commentRestrictedUntil: true,
              commentBanReason: true,
              createdAt: true,
            },
          })
        ),
        getUserPenaltyScore(userId),
        dbQuery(() =>
          prisma.comment_penalties.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 15,
            include: {
              comments: { select: { id: true, content: true } },
            },
          })
        ),
        dbQuery(() =>
          prisma.user_violations.findMany({
            where: { userId },
            orderBy: { lastViolationDate: 'desc' },
          })
        ),
        getPenaltyThresholds(),
      ]);

    if (!user) {
      return NextResponse.json({ success: false, error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const violationCount = violationRows.reduce((sum, v) => sum + v.violationCount, 0);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          commentRestrictedUntil: user.commentRestrictedUntil?.toISOString() ?? null,
        },
        totalPenaltyScore,
        violationCount,
        thresholds,
        penalties: penalties.map((p) => ({
          id: p.id,
          penaltyScore: p.penaltyScore,
          action: p.action,
          createdAt: p.createdAt.toISOString(),
          commentPreview: p.comments?.content?.slice(0, 120) ?? null,
        })),
        violations: violationRows.map((v) => ({
          id: v.id,
          violationType: v.violationType,
          violationCount: v.violationCount,
          totalPenaltyScore: v.totalPenaltyScore,
          lastViolationDate: v.lastViolationDate.toISOString(),
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching violation user detail:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/comments/violations/user/[userId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const action = body.action as RestrictionAction;
    const days = typeof body.days === 'number' ? body.days : undefined;
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (!['restrict', 'unrestrict', 'ban'].includes(action)) {
      return NextResponse.json({ success: false, error: 'عملیات نامعتبر' }, { status: 400 });
    }

    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          commentRestrictedUntil: true,
          commentBanReason: true,
        },
      })
    );
    if (!user) {
      return NextResponse.json({ success: false, error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const before = {
      commentRestrictedUntil: user.commentRestrictedUntil?.toISOString() ?? null,
      commentBanReason: user.commentBanReason,
    };

    const thresholds = await getPenaltyThresholds();
    const { ipAddress, userAgent } = getRequestMeta(request);
    const actorRole = (session.user as { role?: UserRole }).role ?? 'ADMIN';

    if (action === 'unrestrict') {
      await dbQuery(() =>
        prisma.users.update({
          where: { id: userId },
          data: {
            commentRestrictedUntil: null,
            commentBanReason: null,
            updatedAt: new Date(),
          },
        })
      );
      await notifyCommentRestriction(userId, 'lifted');
      await logAudit({
        actorId: session.user.id,
        actorRole,
        action: 'COMMENT_UNRESTRICT',
        entityType: 'USER',
        entityId: userId,
        before,
        after: { commentRestrictedUntil: null, commentBanReason: null },
        ipAddress,
        userAgent,
      });
    } else if (action === 'ban') {
      const banReason = reason || 'مسدودسازی دستی کامنت توسط ادمین';
      await dbQuery(() =>
        prisma.users.update({
          where: { id: userId },
          data: {
            commentRestrictedUntil: new Date('2099-01-01T00:00:00.000Z'),
            commentBanReason: banReason,
            updatedAt: new Date(),
          },
        })
      );
      await notifyCommentRestriction(userId, 'permanent', { reason: banReason });
      await logAudit({
        actorId: session.user.id,
        actorRole,
        action: 'COMMENT_BAN',
        entityType: 'USER',
        entityId: userId,
        before,
        after: {
          commentRestrictedUntil: '2099-01-01T00:00:00.000Z',
          commentBanReason: banReason,
        },
        ipAddress,
        userAgent,
      });
    } else {
      const restrictDays = days && days > 0 ? days : thresholds.restrictDays;
      const until = new Date();
      until.setDate(until.getDate() + restrictDays);
      const restrictReason = reason || `محدودیت ${restrictDays} روزه کامنت`;
      await dbQuery(() =>
        prisma.users.update({
          where: { id: userId },
          data: {
            commentRestrictedUntil: until,
            commentBanReason: restrictReason,
            updatedAt: new Date(),
          },
        })
      );
      await notifyCommentRestriction(userId, 'temporary', {
        until,
        reason: restrictReason,
      });
      await logAudit({
        actorId: session.user.id,
        actorRole,
        action: 'COMMENT_RESTRICT',
        entityType: 'USER',
        entityId: userId,
        before,
        after: {
          commentRestrictedUntil: until.toISOString(),
          commentBanReason: restrictReason,
          days: restrictDays,
        },
        ipAddress,
        userAgent,
      });
    }

    revalidateAdminCommentsCache();

    return NextResponse.json({
      success: true,
      message:
        action === 'unrestrict'
          ? 'محدودیت کامنت برداشته شد'
          : action === 'ban'
            ? 'کامنت‌گذاری کاربر مسدود شد'
            : 'محدودیت موقت اعمال شد',
    });
  } catch (error: unknown) {
    console.error('Error updating comment restriction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
