import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId, sessionUserNotFoundResponse } from '@/lib/api-db';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getProfilePickStatus, MAX_PICKS_PER_CATEGORY } from '@/lib/profile-picks';

const EMPTY_SAVED = {
  savedInPrivateList: false,
  savedInPublicList: false,
  lists: [] as Array<{ id: string; title: string; isPublic: boolean }>,
};

/** GET /api/items/[id]/viewer-state — like + save + profile pick در یک درخواست */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;

    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        select: { id: true, title: true, voteCount: true, catalogItemId: true },
      })
    );

    if (!item) {
      return NextResponse.json({ success: false, error: 'آیتم یافت نشد' }, { status: 404 });
    }

    const session = await auth();
    const userId = session?.user ? await resolveSessionUserId(session) : null;

    let isLiked = false;
    let saved = EMPTY_SAVED;
    let profilePick = {
      isPicked: false,
      pickId: null as string | null,
      canPick: !!item.catalogItemId,
      catalogItemId: item.catalogItemId,
      maxPerCategory: MAX_PICKS_PER_CATEGORY,
    };

    if (userId) {
      const [existingVote, savedItems, pickStatus] = await Promise.all([
        dbQuery(() =>
          prisma.item_votes.findUnique({
            where: { userId_itemId: { userId, itemId } },
            select: { id: true },
          })
        ),
        dbQuery(() =>
          prisma.items.findMany({
            where: {
              title: { equals: item.title, mode: 'insensitive' },
              lists: { userId },
            },
            select: {
              lists: { select: { id: true, title: true, isPublic: true } },
            },
          })
        ),
        item.catalogItemId
          ? dbQuery(() => getProfilePickStatus(userId, item.catalogItemId))
          : Promise.resolve({
              isPicked: false,
              pickId: null,
              categorySlug: null,
            }),
      ]);

      isLiked = !!existingVote;
      saved = {
        savedInPrivateList: savedItems.some((row) => !row.lists.isPublic),
        savedInPublicList: savedItems.some((row) => row.lists.isPublic),
        lists: savedItems.map((row) => ({
          id: row.lists.id,
          title: row.lists.title,
          isPublic: row.lists.isPublic,
        })),
      };
      profilePick = {
        isPicked: pickStatus.isPicked,
        pickId: pickStatus.pickId,
        canPick: !!item.catalogItemId,
        catalogItemId: item.catalogItemId,
        maxPerCategory: MAX_PICKS_PER_CATEGORY,
      };
    }

    const res = NextResponse.json({
      success: true,
      data: {
        like: { isLiked, likeCount: item.voteCount ?? 0 },
        saved,
        profilePick,
      },
    });
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  } catch (error: unknown) {
    console.error('Error fetching item viewer state:', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در دریافت وضعیت') },
      { status: 500 }
    );
  }
}
