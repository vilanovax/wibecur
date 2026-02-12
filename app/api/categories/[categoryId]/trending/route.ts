import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

const RECENT_DAYS = 7;
const RECENT_ACTIVITY_MULTIPLIER = 5;
const CACHE_SECONDS = 600;
const LIMIT = 6;

function isLikelyCuid(param: string): boolean {
  return param.length >= 20 && param.length <= 30 && /^[a-z0-9]+$/i.test(param);
}

async function getTrendingForCategory(categoryId: string) {
  return dbQuery(async () => {
    const cutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

    const [savesLast7Days, items] = await Promise.all([
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { createdAt: { gte: cutoff } },
        _count: { listId: true },
      }),
      prisma.items.findMany({
        where: {
          lists: { categoryId, isActive: true },
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
        take: 80,
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
      const recentBoost = (listIdToRecent[i.listId] ?? 0) * RECENT_ACTIVITY_MULTIPLIER;
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

// GET /api/categories/[categoryId]/trending — داغ‌های این دسته (param = id یا slug)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId: param } = await params;

    if (!param) {
      return NextResponse.json({ error: 'دسته نامعتبر است' }, { status: 400 });
    }

    const category = await dbQuery(() =>
      isLikelyCuid(param)
        ? prisma.categories.findUnique({
            where: { id: param },
            select: { id: true },
          })
        : prisma.categories.findUnique({
            where: { slug: param, isActive: true },
            select: { id: true },
          })
    );

    if (!category) {
      return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 });
    }

    const getCachedTrending = unstable_cache(
      () => getTrendingForCategory(category.id),
      [`trending-category-${category.id}`],
      { revalidate: CACHE_SECONDS, tags: [`trending-${category.id}`] }
    );
    const data = await getCachedTrending();

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Trending error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت داغ‌های این دسته' },
      { status: 500 }
    );
  }
}
