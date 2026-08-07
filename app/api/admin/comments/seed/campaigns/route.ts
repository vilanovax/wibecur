import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { campaignCreateSchema } from '@/lib/comment-seed/types';
import { parseToneMix } from '@/lib/comment-seed/campaign-service';

export async function GET() {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const campaigns = await dbQuery(() =>
    prisma.comment_seed_campaigns.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { drafts: true, comments: true } },
      },
    })
  );

  return NextResponse.json({
    success: true,
    data: campaigns.map((c) => ({
      ...c,
      dateFrom: c.dateFrom.toISOString(),
      dateTo: c.dateTo.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = campaignCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'داده نامعتبر' },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const dateFrom = new Date(input.dateFrom);
  const dateTo = new Date(input.dateTo);
  if (dateTo <= dateFrom) {
    return NextResponse.json(
      { success: false, error: 'بازه تاریخ نامعتبر است' },
      { status: 400 }
    );
  }

  const campaign = await dbQuery(() =>
    prisma.comment_seed_campaigns.create({
      data: {
        title: input.title,
        targetType: input.targetType,
        targetIds: input.targetIds,
        commentCount: input.commentCount,
        perItemCount: input.perItemCount ?? null,
        toneMix: parseToneMix(input.toneMix),
        wordCountMin: input.wordCountMin,
        wordCountMax: input.wordCountMax,
        dateFrom,
        dateTo,
        openaiModel: input.openaiModel ?? null,
        createdByAdminId: auth.id,
        updatedAt: new Date(),
      },
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
