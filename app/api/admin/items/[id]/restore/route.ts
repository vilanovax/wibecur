import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth/require-permission';
import { restoreItems } from '@/lib/admin/item-trash';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';

/** POST: بازگردانی آیتم از زباله‌دان */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAdminUser();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;

    const existing = await prisma.items.findUnique({
      where: { id },
      select: { id: true, title: true, deletedAt: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }
    if (!existing.deletedAt) {
      return NextResponse.json({ error: 'این آیتم در زباله‌دان نیست' }, { status: 400 });
    }

    const processed = await restoreItems(prisma, [id]);
    if (processed === 0) {
      return NextResponse.json({ error: 'بازگردانی انجام نشد' }, { status: 400 });
    }

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'ITEM_RESTORE',
      entityType: 'ITEM',
      entityId: id,
      after: { title: existing.title },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, message: 'بازگردانی انجام شد' });
  } catch (error: unknown) {
    console.error('Item restore error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در بازگردانی' },
      { status: 500 }
    );
  }
}
