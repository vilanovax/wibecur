import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';
import type { ModerationStatus } from '@prisma/client';

const VALID: ModerationStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'IGNORED'];

/** POST: تغییر وضعیت مورد (OPEN / IN_REVIEW / RESOLVED / IGNORED) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('resolve_reports');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const body = await request.json();
    const status = body.status as ModerationStatus | undefined;

    if (!status || !VALID.includes(status)) {
      return NextResponse.json(
        { error: 'وضعیت نامعتبر. مجاز: OPEN, IN_REVIEW, RESOLVED, IGNORED' },
        { status: 400 }
      );
    }

    const existing = await prisma.moderation_case.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'مورد یافت نشد' }, { status: 404 });
    }

    const updated = await prisma.moderation_case.update({
      where: { id },
      data: { status },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'MOD_CASE_STATUS_CHANGE',
      entityType: 'MODERATION_CASE',
      entityId: id,
      before: { status: existing.status },
      after: { status: updated.status },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (err: unknown) {
    console.error('Moderation status error:', err);
    return NextResponse.json(
      { error: 'خطا در تغییر وضعیت' },
      { status: 500 }
    );
  }
}
