import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { draftUpdateSchema } from '@/lib/comment-seed/types';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();
  const parsed = draftUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'داده نامعتبر' },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (input.content != null) {
    data.content = input.content;
    data.wordCount = input.content.length;
  }
  if (input.personaId != null) data.personaId = input.personaId;
  if (input.scheduledAt != null) data.scheduledAt = new Date(input.scheduledAt);
  if (input.status != null) data.status = input.status;
  if (input.tone != null) data.tone = input.tone;

  const draft = await dbQuery(() =>
    prisma.comment_seed_drafts.update({
      where: { id },
      data: data as never,
      include: {
        persona: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        items: { select: { id: true, title: true } },
      },
    })
  );

  return NextResponse.json({
    success: true,
    data: {
      ...draft,
      scheduledAt: draft.scheduledAt.toISOString(),
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const draft = await dbQuery(() =>
    prisma.comment_seed_drafts.findUnique({ where: { id }, select: { status: true } })
  );
  if (!draft) {
    return NextResponse.json({ success: false, error: 'پیش‌نویس یافت نشد' }, { status: 404 });
  }
  if (draft.status === 'published') {
    return NextResponse.json(
      { success: false, error: 'پیش‌نویس منتشرشده قابل حذف نیست' },
      { status: 400 }
    );
  }

  await dbQuery(() => prisma.comment_seed_drafts.delete({ where: { id } }));
  return NextResponse.json({ success: true });
}
