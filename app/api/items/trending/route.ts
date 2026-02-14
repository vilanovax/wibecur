import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

const RECENT_DAYS = 7;
const RECENT_ACTIVITY_MULTIPLIER = 5;
const CACHE_SECONDS = 600; // 10 min
const LIMIT = 8;

async function getGlobalTrending() {
  return dbQuery(async () => {
    const cutoff = new Date(
      Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000
    );

    const [savesLast7Days, items] = await Promise.all([
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { createdAt: { gte: cutoff } },
        _count: { listId: true },
      }),
      prisma.items.findMany({
        where: {
          lists: { isActive: true },
          OR: [
            { item_moderation: null },
            { item_moderation: { status: { notIn: ['HIDDEN', 'UNDER_REVIEW'] } } },
          ],
        },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          rating: true,
          voteCount: true,
          listId: true,
          lists: { select: { saveCount: true } },
          _count: { select: { comments: true } },
        },
        take: 100,
      }),
    ]);

    const listIdToRecentSaves: Record<string, number> = {};
    for (const row of savesLast7Days) {
      listIdToRecentSaves[row.listId] = row._count.listId;
    }

    const withScore = items.map((i) => {
      const saveCount = i.lists?.saveCount ?? 0;
      const commentCount = i._count.comments;
      const likeCount = i.voteCount ?? 0;
      const recentSaves = listIdToRecentSaves[i.listId] ?? 0;
      const recentActivityScore = recentSaves * RECENT_ACTIVITY_MULTIPLIER;
      const trendScore =
        saveCount * 4 +
        commentCount * 3 +
        likeCount * 2 +
        recentActivityScore;
      return {
        id: i.id,
        title: i.title,
        image: i.imageUrl,
        rating: i.rating,
        saveCount,
        trendScore,
      };
    });

    return withScore
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, LIMIT);
  });
}

// GET /api/items/trending — داغ‌های سراسری (کش ۱۰ دقیقه)
export async function GET() {
  try {
    const getCached = unstable_cache(
      getGlobalTrending,
      ['trending-global'],
      { revalidate: CACHE_SECONDS, tags: ['trending-global'] }
    );
    const data = await getCached();

    const response = NextResponse.json({ data }, { status: 200 });
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return response;
  } catch (err) {
    console.error('Global trending error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت داغ‌ها' },
      { status: 500 }
    );
  }
}
