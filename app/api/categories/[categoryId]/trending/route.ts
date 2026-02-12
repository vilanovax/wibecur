import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

const RECENT_DAYS = 14;
const RECENT_BOOST = 5;
const CACHE_SECONDS = 600; // 10 min

function getTrendingForCategory(categoryId: string) {
  return dbQuery(async () => {
    const items = await prisma.items.findMany({
      where: {
        lists: {
          categoryId,
          isActive: true,
        },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        rating: true,
        voteCount: true,
        createdAt: true,
        lists: {
          select: { saveCount: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      take: 50,
    });

    const now = new Date();
    const cutoff = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);

    const withScore = items.map((i) => {
      const saveCount = i.lists?.saveCount ?? 0;
      const commentCount = i._count.comments;
      const likeCount = i.voteCount ?? 0;
      const recentBoost = i.createdAt >= cutoff ? RECENT_BOOST : 0;
      const trendScore =
        saveCount * 3 + commentCount * 2 + likeCount * 1 + recentBoost;
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
      .slice(0, 5);
  });
}

// GET /api/categories/[categoryId]/trending — داغ‌های این دسته (کش ۱۰ دقیقه)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json({ error: 'دسته نامعتبر است' }, { status: 400 });
    }

    const category = await dbQuery(() =>
      prisma.categories.findUnique({
        where: { id: categoryId },
        select: { id: true },
      })
    );

    if (!category) {
      return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 });
    }

    const getCachedTrending = unstable_cache(
      () => getTrendingForCategory(categoryId),
      [`trending-category-${categoryId}`],
      { revalidate: CACHE_SECONDS, tags: [`trending-${categoryId}`] }
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
