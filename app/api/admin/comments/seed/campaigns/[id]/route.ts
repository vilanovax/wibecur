import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { campaignCreateSchema } from '@/lib/comment-seed/types';
import { parseToneMix } from '@/lib/comment-seed/campaign-service';
import { countSeedTargetItems } from '@/lib/comment-seed/target-resolver';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const campaign = await dbQuery(() =>
    prisma.comment_seed_campaigns.findUnique({
      where: { id },
      include: {
        _count: { select: { drafts: true, comments: true } },
      },
    })
  );

  if (!campaign) {
    return NextResponse.json({ success: false, error: 'کمپین یافت نشد' }, { status: 404 });
  }

  const targetItemCount = await countSeedTargetItems(campaign.targetType, campaign.targetIds);

  return NextResponse.json({
    success: true,
    data: {
      ...campaign,
      targetItemCount,
      dateFrom: campaign.dateFrom.toISOString(),
      dateTo: campaign.dateTo.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();

  const partial = campaignCreateSchema.partial().safeParse(body);
  if (!partial.success) {
    return NextResponse.json(
      { success: false, error: partial.error.issues[0]?.message ?? 'داده نامعتبر' },
      { status: 400 }
    );
  }

  const input = partial.data;
  const data: Record<string, unknown> = { updatedAt: new Date() };

  if (input.title != null) data.title = input.title;
  if (input.targetType != null) data.targetType = input.targetType;
  if (input.targetIds != null) data.targetIds = input.targetIds;
  if (input.commentCount != null) data.commentCount = input.commentCount;
  if (input.perItemCount !== undefined) data.perItemCount = input.perItemCount;
  if (input.toneMix != null) data.toneMix = parseToneMix(input.toneMix);
  if (input.wordCountMin != null) data.wordCountMin = input.wordCountMin;
  if (input.wordCountMax != null) data.wordCountMax = input.wordCountMax;
  if (input.dateFrom != null) data.dateFrom = new Date(input.dateFrom);
  if (input.dateTo != null) data.dateTo = new Date(input.dateTo);
  if (input.openaiModel !== undefined) data.openaiModel = input.openaiModel;
  if (body.status != null) data.status = body.status;

  const campaign = await dbQuery(() =>
    prisma.comment_seed_campaigns.update({
      where: { id },
      data: data as never,
    })
  );

  return NextResponse.json({
    success: true,
    data: {
      ...campaign,
      dateFrom: campaign.dateFrom.toISOString(),
      dateTo: campaign.dateTo.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await dbQuery(() =>
    prisma.comment_seed_campaigns.update({
      where: { id },
      data: { status: 'archived', updatedAt: new Date() },
    })
  );

  return NextResponse.json({ success: true });
}
