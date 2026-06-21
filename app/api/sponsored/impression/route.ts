import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-config';
import { trackSponsoredImpression } from '@/lib/sponsored-placements';

/** POST /api/sponsored/impression — body: { placementId, listId?, categoryId? } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const placementId = body?.placementId;

    if (!placementId || typeof placementId !== 'string') {
      return NextResponse.json({ error: 'placementId الزامی است' }, { status: 400 });
    }

    const session = await auth();
    const listId = typeof body.listId === 'string' ? body.listId : undefined;
    const categoryId = typeof body.categoryId === 'string' ? body.categoryId : undefined;

    const ok = await trackSponsoredImpression(prisma, placementId, {
      userId: session?.user?.id ?? null,
      listId,
      categoryId,
    });

    if (!ok) {
      return NextResponse.json({ error: 'تبلیغ یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Sponsored impression error:', err);
    return NextResponse.json({ error: 'خطا در ثبت نمایش' }, { status: 500 });
  }
}
