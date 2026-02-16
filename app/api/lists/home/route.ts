import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getGlobalTrending, getFastRising } from '@/lib/trending/service';
import { getCurrentFeaturedSlot } from '@/lib/home-featured';

/**
 * GET /api/lists/home
 * لیست‌های عمومی برای صفحهٔ اول: featured + trending + rising + recommendations.
 * featured از اسلات زمان‌بندی‌شده (در صورت وجود) وگرنه fallback به isFeatured + saveCount.
 */
export async function GET() {
  try {
    let slotResult: Awaited<ReturnType<typeof getCurrentFeaturedSlot>> = null;
    try {
      slotResult = await dbQuery(() => getCurrentFeaturedSlot(prisma));
    } catch (slotErr) {
      console.warn('getCurrentFeaturedSlot failed, using fallback:', slotErr);
    }

    const [lists, trendingResults, risingResults] = await Promise.all([
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
            userId: true,
            categories: {
              select: { id: true, name: true, slug: true, icon: true },
            },
            users: {
              select: { id: true, name: true, username: true },
            },
          },
          orderBy: [{ isFeatured: 'desc' }, { saveCount: 'desc' }],
          take: 10,
        })
      ),
      getGlobalTrending(prisma, 6),
      getFastRising(prisma, 6),
    ]);

    const featuredFromSlot = slotResult?.list ?? null;
    const featured = featuredFromSlot ?? (lists.length > 0 ? lists[0] : null);
    const featuredSlotId = slotResult?.slotId ?? null;

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

    const mapRising = (r: (typeof risingResults)[0]) => ({
      id: r.listId,
      title: r.title,
      slug: r.slug,
      description: '',
      coverImage: r.coverImage ?? '',
      saveCount: r.saveCount,
      itemCount: r.itemCount,
      likes: r.likeCount,
      isFastRising: r.isFastRising ?? false,
    });

    const mapFeatured = featured
      ? {
          ...mapList(featured as (typeof lists)[0]),
          creator: featured.users
            ? { name: featured.users.name, username: featured.users.username }
            : null,
        }
      : null;

    const response = NextResponse.json({
      success: true,
      data: {
        featured: mapFeatured,
        featuredSlotId,
        trending: trendingResults.map(mapTrending),
        rising: risingResults.map(mapRising),
        recommendations: lists.slice(0, 4).map(mapList),
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
        data: { featured: null, trending: [], rising: [], recommendations: [] },
      });
    }
    console.error('Error fetching home lists:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}
