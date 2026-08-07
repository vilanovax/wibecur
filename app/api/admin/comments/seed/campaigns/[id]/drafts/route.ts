import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const drafts = await dbQuery(() =>
    prisma.comment_seed_drafts.findMany({
      where: {
        campaignId: id,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { scheduledAt: 'desc' },
      include: {
        persona: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        items: { select: { id: true, title: true } },
      },
    })
  );

  return NextResponse.json({
    success: true,
    data: drafts.map((d) => ({
      ...d,
      scheduledAt: d.scheduledAt.toISOString(),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  });
}
