import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { ruleUpsertSchema } from '@/lib/comment-seed/types';

export async function GET() {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const rules = await dbQuery(() =>
    prisma.comment_seed_rules.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })
  );

  return NextResponse.json({
    success: true,
    data: rules.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = ruleUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'داده نامعتبر' },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const rule = await dbQuery(() =>
    prisma.comment_seed_rules.upsert({
      where: {
        scopeType_scopeId: {
          scopeType: input.scopeType,
          scopeId: input.scopeId,
        },
      },
      create: {
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        enabled: input.enabled,
        campaignId: input.campaignId ?? null,
        updatedAt: new Date(),
      },
      update: {
        enabled: input.enabled,
        campaignId: input.campaignId ?? null,
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
