import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import type { ModerationType, ModerationEntityType } from '@prisma/client';

const VALID_TYPES: ModerationType[] = ['REPORT', 'AUTO_FLAG', 'ANOMALY', 'PENDING'];
const VALID_ENTITY: ModerationEntityType[] = ['LIST', 'COMMENT', 'USER', 'CATEGORY'];

/** POST: ایجاد دستی مورد صف (MVP) */
export async function POST(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('assign_moderation');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await request.json();
    const { type, entityType, entityId, reason, severity } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'نوع نامعتبر' },
        { status: 400 }
      );
    }
    if (!entityType || !VALID_ENTITY.includes(entityType)) {
      return NextResponse.json(
        { error: 'نوع موجودیت نامعتبر' },
        { status: 400 }
      );
    }
    if (!entityId || typeof entityId !== 'string') {
      return NextResponse.json({ error: 'entityId الزامی است' }, { status: 400 });
    }
    if (!reason || typeof reason !== 'string') {
      return NextResponse.json({ error: 'دلیل الزامی است' }, { status: 400 });
    }

    const sev = severity != null ? parseInt(String(severity), 10) : 1;
    const severityNum = sev >= 1 && sev <= 3 ? sev : 1;

    const created = await prisma.moderation_case.create({
      data: {
        type,
        entityType,
        entityId,
        reason: reason.trim(),
        severity: severityNum,
        reportCount: 0,
      },
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    console.error('Moderation create error:', err);
    return NextResponse.json(
      { error: 'خطا در ایجاد مورد' },
      { status: 500 }
    );
  }
}
