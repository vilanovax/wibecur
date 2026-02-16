import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalList } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';

/** POST: بازگردانی از زباله‌دان */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('soft_delete_list');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;

    const existing = await prisma.lists.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
    }
    if (!existing.deletedAt) {
      return NextResponse.json({ error: 'این لیست در زباله‌دان نیست' }, { status: 400 });
    }

    const updated = await prisma.lists.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        deleteReason: null,
        isActive: true,
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'LIST_RESTORE',
      entityType: 'LIST',
      entityId: id,
      before: minimalList(existing),
      after: minimalList(updated),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, message: 'بازگردانی انجام شد' });
  } catch (err: unknown) {
    console.error('List restore error:', err);
    return NextResponse.json(
      { error: 'خطا در بازگردانی' },
      { status: 500 }
    );
  }
}
