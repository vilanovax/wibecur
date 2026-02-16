import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalList } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';

/** POST: انتقال لیست به زباله‌دان از داخل صف بررسی + لاگ MOD_ACTION_TRASH_LIST */
export async function POST(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('resolve_reports');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await request.json();
    const { caseId, entityId } = body;
    if (!caseId || !entityId) {
      return NextResponse.json({ error: 'caseId و entityId الزامی هستند' }, { status: 400 });
    }

    const case_ = await prisma.moderation_case.findUnique({
      where: { id: caseId },
    });
    if (!case_ || case_.entityType !== 'LIST' || case_.entityId !== entityId) {
      return NextResponse.json({ error: 'مورد یا لیست نامعتبر' }, { status: 400 });
    }

    const existing = await prisma.lists.findUnique({
      where: { id: entityId },
      include: { _count: { select: { bookmarks: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
    }
    if (existing.deletedAt) {
      return NextResponse.json({ error: 'این لیست قبلاً به زباله‌دان منتقل شده' }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.lists.update({
      where: { id: entityId },
      data: {
        deletedAt: now,
        deletedById: userOrRes.id,
        deleteReason: `Moderation case ${caseId}`,
        isActive: false,
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'LIST_SOFT_DELETE',
      entityType: 'LIST',
      entityId: entityId,
      before: minimalList({ ...existing, _count: existing._count }),
      after: minimalList(updated),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'MOD_ACTION_TRASH_LIST',
      entityType: 'REPORT',
      entityId: caseId,
      after: { listId: entityId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await prisma.moderation_case.update({
      where: { id: caseId },
      data: { status: 'RESOLVED' },
    });

    return NextResponse.json({ success: true, message: 'لیست به زباله‌دان منتقل شد' });
  } catch (err: unknown) {
    console.error('Moderation trash-list error:', err);
    return NextResponse.json(
      { error: 'خطا در انتقال به زباله‌دان' },
      { status: 500 }
    );
  }
}
