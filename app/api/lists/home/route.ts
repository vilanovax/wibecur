import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getGlobalTrending } from '@/lib/trending/service';

/**
 * GET /api/lists/home
 * لیست‌های عمومی برای صفحهٔ اول: featured (یک لیست) + trending (Trending Engine) + recommendations.
 */
export async function GET() {
  try {
    const [lists, trendingResults] = await Promise.all([
      dbQuery(() =>
        prisma.lists.findMany({
          where: {
            isActive: true,
            isPublic: true,
            users: { role: { not: 'USER' } },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            coverImage: true,
            saveCount: true,
            itemCount: true,
            likeCount: true,
            isFeatured: true,
            badge: true,
            categories: {
              select: { id: true, name: true, slug: true, icon: true },
            },
          },
          orderBy: [{ isFeatured: 'desc' }, { saveCount: 'desc' }],
          take: 10,
        })
      ),
      getGlobalTrending(prisma, 6),
    ]);

    const featured = lists.length > 0 ? lists[0] : null;

    const mapList = (l: (typeof lists)[0]) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description ?? '',
      coverImage: l.coverImage ?? '',
      saveCount: l.saveCount ?? 0,
      itemCount: l.itemCount ?? 0,
      likes: l.likeCount ?? 0,
      badge: (l.isFeatured ? 'featured' : (l.badge?.toLowerCase() ?? undefined)) as 'trending' | 'new' | 'featured' | undefined,
      categories: l.categories,
    });

    const mapTrending = (t: (typeof trendingResults)[0]) => ({
      id: t.listId,
      title: t.title,
      slug: t.slug,
      description: '',
      coverImage: t.coverImage ?? '',
      saveCount: t.saveCount,
      itemCount: t.itemCount,
      likes: t.likeCount,
      badge: (t.badge === 'viral' ? 'trending' : t.badge === 'hot' ? 'trending' : undefined) as 'trending' | 'new' | 'featured' | undefined,
      categories: undefined,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        featured: featured ? mapList(featured) : null,
        trending: trendingResults.map(mapTrending),
        recommendations: lists.slice(0, 2).map(mapList),
      },
    });
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return response;
  } catch (error: any) {
    const msg = String(error?.message ?? '');
    const isDbUnavailable =
      error?.code === 'P1001' ||
      msg.includes("Can't reach database") ||
      msg.includes('connection refused') ||
      msg.includes('ECONNREFUSED');

    if (isDbUnavailable) {
      console.warn('Database unavailable, returning empty home data:', msg);
      return NextResponse.json({
        success: true,
        data: { featured: null, trending: [], recommendations: [] },
      });
    }
    console.error('Error fetching home lists:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}
