import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { revalidateAdminCommentsCache } from '@/lib/admin/admin-cache';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';

// POST /api/admin/comments/[id]/discard-reports — رد ریپورت‌های باز بدون تغییر کامنت یا امتیاز منفی
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

    const { id: commentId } = await params;

    const comment = await dbQuery(() =>
      prisma.comments.findUnique({
        where: { id: commentId },
        select: { id: true },
      })
    );

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    const result = await dbQuery(() =>
      prisma.comment_reports.updateMany({
        where: { commentId, resolved: false },
        data: { resolved: true },
      })
    );

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: 'ریپورت باز برای این کامنت وجود ندارد' },
        { status: 400 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    const actorRole = (session.user as { role?: UserRole }).role ?? 'ADMIN';
    await logAudit({
      actorId: session.user.id,
      actorRole,
      action: 'COMMENT_REPORTS_DISCARDED',
      entityType: 'COMMENT',
      entityId: commentId,
      after: { resolvedCount: result.count },
      ipAddress,
      userAgent,
    });

    revalidateAdminCommentsCache();

    return NextResponse.json({
      success: true,
      message: 'ریپورت‌ها رد شد',
      data: { resolvedCount: result.count },
    });
  } catch (error: unknown) {
    console.error('Error discarding comment reports:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
