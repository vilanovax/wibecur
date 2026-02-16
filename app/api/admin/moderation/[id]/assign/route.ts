import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';

/** POST: تخصیص مورد به خودم یا به کاربر مشخص */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('assign_moderation');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const assignToMe = body.assignToMe === true;
    const assigneeId = assignToMe ? userOrRes.id : (body.assigneeId ?? null);

    const existing = await prisma.moderation_case.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'مورد یافت نشد' }, { status: 404 });
    }

    const updated = await prisma.moderation_case.update({
      where: { id },
      data: { assigneeId },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'MOD_CASE_ASSIGN',
      entityType: 'REPORT',
      entityId: id,
      before: { assigneeId: existing.assigneeId },
      after: { assigneeId: updated.assigneeId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, assigneeId: updated.assigneeId });
  } catch (err: unknown) {
    console.error('Moderation assign error:', err);
    return NextResponse.json(
      { error: 'خطا در تخصیص' },
      { status: 500 }
    );
  }
}
