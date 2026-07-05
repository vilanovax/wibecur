import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveItemTipReviewKeys } from '@/lib/admin/item-tips-server';

const BodySchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(500),
});

/** POST /api/admin/items/tip-review-keys — نرمال‌سازی کلیدهای «انجام شد» به catalogItemId */
export async function POST(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = BodySchema.parse(await request.json());
    const keys = await resolveItemTipReviewKeys(prisma, body.ids);
    return NextResponse.json({ success: true, data: { keys } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? 'ورودی نامعتبر' },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'خطا در resolve کلیدها';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
