import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalUser } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';

/** POST: تعلیق کاربر از داخل صف بررسی + لاگ MOD_ACTION_SUSPEND_USER */
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
    if (!case_ || case_.entityType !== 'USER' || case_.entityId !== entityId) {
      return NextResponse.json({ error: 'مورد یا کاربر نامعتبر' }, { status: 400 });
    }

    if (entityId === userOrRes.id) {
      return NextResponse.json({ error: 'امکان تعلیق خودتان وجود ندارد' }, { status: 400 });
    }

    const existing = await prisma.users.findUnique({
      where: { id: entityId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const updated = await prisma.users.update({
      where: { id: entityId },
      data: { isActive: false },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'USER_SUSPEND',
      entityType: 'USER',
      entityId: entityId,
      before: minimalUser(existing),
      after: minimalUser(updated),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'MOD_ACTION_SUSPEND_USER',
      entityType: 'REPORT',
      entityId: caseId,
      after: { userId: entityId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await prisma.moderation_case.update({
      where: { id: caseId },
      data: { status: 'RESOLVED' },
    });

    return NextResponse.json({ success: true, message: 'کاربر تعلیق شد' });
  } catch (err: unknown) {
    console.error('Moderation suspend-user error:', err);
    return NextResponse.json(
      { error: 'خطا در تعلیق کاربر' },
      { status: 500 }
    );
  }
}
