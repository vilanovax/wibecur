import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

const CACHE_SECONDS = 900; // 15 min
const LIMIT = 6;

async function getAlsoLikedForItem(currentItemId: string) {
  return dbQuery(async () => {
    const currentItem = await prisma.items.findUnique({
      where: { id: currentItemId },
      select: { id: true, listId: true },
    });

    if (!currentItem) return [];

    const [userIdsLiked, userIdsSavedList] = await Promise.all([
      prisma.item_votes.findMany({
        where: { itemId: currentItemId },
        select: { userId: true },
      }),
      prisma.bookmarks.findMany({
        where: { listId: currentItem.listId },
        select: { userId: true },
      }),
    ]);

    const cohortUserIds = new Set<string>([
      ...userIdsLiked.map((r) => r.userId),
      ...userIdsSavedList.map((b) => b.userId),
    ]);

    if (cohortUserIds.size === 0) return [];

    const cohortList = Array.from(cohortUserIds);

    const bookmarksByCohort = await prisma.bookmarks.findMany({
      where: { userId: { in: cohortList } },
      select: { listId: true },
    });

    const listIdToCommonCount: Record<string, number> = {};
    for (const b of bookmarksByCohort) {
      listIdToCommonCount[b.listId] = (listIdToCommonCount[b.listId] ?? 0) + 1;
    }

    const listIdsWithOverlap = Object.keys(listIdToCommonCount).filter(
      (lid) => lid !== currentItem.listId && listIdToCommonCount[lid] > 0
    );

    if (listIdsWithOverlap.length === 0) return [];

    const items = await prisma.items.findMany({
      where: {
        listId: { in: listIdsWithOverlap },
        id: { not: currentItemId },
        lists: { isActive: true },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        rating: true,
        listId: true,
      },
      take: 30,
    });

    const withCount = items.map((i) => ({
      id: i.id,
      title: i.title,
      image: i.imageUrl,
      rating: i.rating,
      commonUsersCount: listIdToCommonCount[i.listId] ?? 0,
    }));

    const sorted = withCount
      .sort((a, b) => b.commonUsersCount - a.commonUsersCount)
      .filter((i) => i.commonUsersCount > 0)
      .slice(0, LIMIT);

    return sorted;
  });
}

// GET /api/items/[id]/also-liked — کسایی که اینو دوست داشتن، اینا رو هم دوست داشتن (کش ۱۵ دقیقه)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;

    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        select: { id: true },
      })
    );

    if (!item) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }

    const getCached = unstable_cache(
      () => getAlsoLikedForItem(itemId),
      [`also-liked-${itemId}`],
      { revalidate: CACHE_SECONDS, tags: [`also-liked-${itemId}`] }
    );
    const data = await getCached();

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Also-liked error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت پیشنهادها' },
      { status: 500 }
    );
  }
}
