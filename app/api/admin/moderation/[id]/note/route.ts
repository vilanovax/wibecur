import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';

/** POST: افزودن یادداشت داخلی به مورد */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('resolve_reports');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id: caseId } = await params;
    const body = await request.json();
    const bodyText = typeof body.body === 'string' ? body.body.trim() : '';

    if (!bodyText) {
      return NextResponse.json({ error: 'متن یادداشت الزامی است' }, { status: 400 });
    }

    const case_ = await prisma.moderation_case.findUnique({ where: { id: caseId } });
    if (!case_) {
      return NextResponse.json({ error: 'مورد یافت نشد' }, { status: 404 });
    }

    const note = await prisma.moderation_note.create({
      data: {
        caseId,
        authorId: userOrRes.id,
        body: bodyText,
      },
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'MOD_NOTE_ADD',
      entityType: 'MODERATION_CASE',
      entityId: caseId,
      after: { noteId: note.id, bodyLength: bodyText.length },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, note });
  } catch (err: unknown) {
    console.error('Moderation note error:', err);
    return NextResponse.json(
      { error: 'خطا در ثبت یادداشت' },
      { status: 500 }
    );
  }
}
