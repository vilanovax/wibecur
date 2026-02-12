import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

const CACHE_SECONDS = 120;
const RECENT_DAYS = 7;
const RECENT_MULTIPLIER = 5;
const LIMIT = 5;

async function getPulseTrending() {
  return dbQuery(async () => {
    const cutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

    const [savesLast7Days, items] = await Promise.all([
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { createdAt: { gte: cutoff } },
        _count: { listId: true },
      }),
      prisma.items.findMany({
        where: { lists: { isActive: true } },
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
        take: 60,
      }),
    ]);

    const listIdToRecent: Record<string, number> = {};
    savesLast7Days.forEach((r) => {
      listIdToRecent[r.listId] = r._count.listId;
    });

    const withScore = items.map((i) => {
      const saveCount = i.lists?.saveCount ?? 0;
      const commentCount = i._count.comments;
      const likeCount = i.voteCount ?? 0;
      const recentBoost = (listIdToRecent[i.listId] ?? 0) * RECENT_MULTIPLIER;
      const trendScore =
        saveCount * 4 + commentCount * 3 + likeCount * 2 + recentBoost;
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

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const getCached = unstable_cache(
      getPulseTrending,
      ['admin-pulse-trending'],
      { revalidate: CACHE_SECONDS, tags: ['admin-pulse'] }
    );
    const data = await getCached();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Pulse trending error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت ترندها' },
      { status: 500 }
    );
  }
}
