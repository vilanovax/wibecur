import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalCategory } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';

/** POST: انتقال به زباله‌دان (soft delete) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_categories');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason : undefined;

    const existing = await prisma.categories.findUnique({
      where: { id },
      include: { _count: { select: { lists: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }
    if (existing.deletedAt) {
      return NextResponse.json({ error: 'این دسته قبلاً به زباله‌دان منتقل شده' }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.categories.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedById: userOrRes.id,
        deleteReason: reason ?? null,
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'CATEGORY_SOFT_DELETE',
      entityType: 'CATEGORY',
      entityId: id,
      before: minimalCategory(existing),
      after: minimalCategory(updated),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'به زباله‌دان منتقل شد',
      listCount: existing._count?.lists ?? 0,
    });
  } catch (err: unknown) {
    console.error('Category trash error:', err);
    return NextResponse.json(
      { error: 'خطا در انتقال به زباله‌دان' },
      { status: 500 }
    );
  }
}
