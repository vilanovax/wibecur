import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId } from '@/lib/api-db';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getProfilePickStatus, MAX_PICKS_PER_CATEGORY } from '@/lib/profile-picks';

/** GET /api/items/[id]/profile-pick-status */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        isPicked: false,
        pickId: null,
        categorySlug: null,
        canPick: false,
        catalogItemId: null,
        maxPerCategory: MAX_PICKS_PER_CATEGORY,
      });
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({
        isPicked: false,
        pickId: null,
        categorySlug: null,
        canPick: false,
        catalogItemId: null,
        maxPerCategory: MAX_PICKS_PER_CATEGORY,
      });
    }

    const { id: itemId } = await params;
    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        select: { catalogItemId: true },
      })
    );

    if (!item) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }

    const status = await dbQuery(() => getProfilePickStatus(userId, item.catalogItemId));

    return NextResponse.json({
      ...status,
      canPick: !!item.catalogItemId,
      catalogItemId: item.catalogItemId,
      maxPerCategory: MAX_PICKS_PER_CATEGORY,
    });
  } catch (error) {
    console.error('profile-pick-status:', error);
    return NextResponse.json({ error: 'خطا در بررسی وضعیت' }, { status: 500 });
  }
}
