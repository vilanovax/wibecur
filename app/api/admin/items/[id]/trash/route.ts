import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth/require-permission';
import { softDeleteItems } from '@/lib/admin/item-trash';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';

/** POST: انتقال آیتم به زباله‌دان */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAdminUser();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason : undefined;

    const existing = await prisma.items.findUnique({
      where: { id },
      select: { id: true, title: true, deletedAt: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }
    if (existing.deletedAt) {
      return NextResponse.json({ error: 'این آیتم قبلاً به زباله‌دان منتقل شده' }, { status: 400 });
    }

    const processed = await softDeleteItems(prisma, [id], userOrRes.id, reason ?? null);
    if (processed === 0) {
      return NextResponse.json({ error: 'انتقال به زباله‌دان انجام نشد' }, { status: 400 });
    }

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'ITEM_SOFT_DELETE',
      entityType: 'ITEM',
      entityId: id,
      before: { title: existing.title },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, message: 'به زباله‌دان منتقل شد' });
  } catch (error: unknown) {
    console.error('Item trash error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در انتقال به زباله‌دان' },
      { status: 500 }
    );
  }
}
