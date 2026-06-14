import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { revalidateAdminCommentsCache } from '@/lib/admin/admin-cache';
import {
  applyAutoRestrictionAfterPenalty,
  getUserPenaltyScore,
} from '@/lib/comment-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';

// POST /api/admin/comments/[id]/penalty - ثبت امتیاز منفی برای کامنت
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const adminId = session.user.id;
    const { id: commentId } = await params;
    const body = await request.json();
    const { penaltyScore, action } = body;

    if (penaltyScore === undefined || penaltyScore < 0 || penaltyScore > 5) {
      return NextResponse.json(
        { success: false, error: 'امتیاز باید بین 0 تا 5 باشد' },
        { status: 400 }
      );
    }

    // Get comment to find the user who wrote it
    const comment = await dbQuery(() =>
      prisma.comments.findUnique({
        where: { id: commentId },
        select: { userId: true },
      })
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    // Create penalty record
    // Check if model exists (for debugging)
    if (!prisma.comment_penalties) {
      console.error('comment_penalties model not found in Prisma client');
      return NextResponse.json(
        { success: false, error: 'Prisma client not updated. Please restart the server.' },
        { status: 500 }
      );
    }

    await dbQuery(() =>
      prisma.comment_penalties.create({
        data: {
          commentId,
          userId: comment.userId,
          adminId,
          penaltyScore,
          action: action || 'delete',
        },
      })
    );

    // Update or create user violations total penalty score
    const existingViolation = await dbQuery(() =>
      prisma.user_violations.findFirst({
        where: { userId: comment.userId },
      })
    );

    if (existingViolation) {
      await dbQuery(() =>
        prisma.user_violations.update({
          where: { id: existingViolation.id },
          data: {
            totalPenaltyScore: { increment: penaltyScore },
            violationCount: { increment: 1 },
            lastViolationDate: new Date(),
          },
        })
      );
    } else {
      await dbQuery(() =>
        prisma.user_violations.create({
          data: {
            userId: comment.userId,
            commentId,
            violationType: 'penalty',
            violationCount: 1,
            totalPenaltyScore: penaltyScore,
            lastViolationDate: new Date(),
            updatedAt: new Date(),
          },
        })
      );
    }

    if (penaltyScore > 0) {
      await dbQuery(() =>
        prisma.users.update({
          where: { id: comment.userId },
          data: {
            reputationScore: { decrement: penaltyScore },
            updatedAt: new Date(),
          },
        })
      );
      const totalScore = await getUserPenaltyScore(comment.userId);
      await applyAutoRestrictionAfterPenalty(comment.userId, totalScore);
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    const actorRole = (session.user as { role?: UserRole }).role ?? 'ADMIN';
    await logAudit({
      actorId: adminId,
      actorRole,
      action: 'COMMENT_PENALTY',
      entityType: 'COMMENT',
      entityId: commentId,
      after: {
        userId: comment.userId,
        penaltyScore,
        action: action || 'delete',
      },
      ipAddress,
      userAgent,
    });

    revalidateAdminCommentsCache();

    return NextResponse.json({
      success: true,
      message: 'امتیاز منفی ثبت شد',
    });
  } catch (error: any) {
    console.error('Error creating penalty:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

