import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();

  const rule = await dbQuery(() =>
    prisma.comment_seed_rules.update({
      where: { id },
      data: {
        ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
        ...(body.campaignId !== undefined ? { campaignId: body.campaignId } : {}),
        updatedAt: new Date(),
      },
    })
  );

  return NextResponse.json({
    success: true,
    data: {
      ...rule,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await dbQuery(() => prisma.comment_seed_rules.delete({ where: { id } }));
  return NextResponse.json({ success: true });
}
