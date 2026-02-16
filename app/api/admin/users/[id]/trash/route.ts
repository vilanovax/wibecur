import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalUser } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';

/** POST: انتقال به زباله‌دان (soft delete) — کاربر از دید عموم مخفی می‌شود */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('suspend_user');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason : undefined;

    const existing = await prisma.users.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }
    if (existing.deletedAt) {
      return NextResponse.json({ error: 'این کاربر قبلاً به زباله‌دان منتقل شده' }, { status: 400 });
    }
    if (existing.id === userOrRes.id) {
      return NextResponse.json({ error: 'امکان حذف خودتان وجود ندارد' }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.users.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedById: userOrRes.id,
        deleteReason: reason ?? null,
        isActive: false,
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'USER_SOFT_DELETE',
      entityType: 'USER',
      entityId: id,
      before: minimalUser(existing),
      after: minimalUser(updated),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, message: 'به زباله‌دان منتقل شد' });
  } catch (err: unknown) {
    console.error('User trash error:', err);
    return NextResponse.json(
      { error: 'خطا در انتقال به زباله‌دان' },
      { status: 500 }
    );
  }
}
