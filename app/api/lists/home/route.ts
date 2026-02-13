import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

/**
 * GET /api/lists/home
 * لیست‌های عمومی برای صفحهٔ اول: featured (یک لیست) + trending (چند لیست).
 * coverImage بعد از مهاجرت از استوریج (مثلاً لیارا) می‌آید.
 */
export async function GET() {
  try {
    const lists = await dbQuery(() =>
      prisma.lists.findMany({
        where: { isActive: true, isPublic: true },
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
    );

    const featured = lists.length > 0 ? lists[0] : null;
    const trending = lists.slice(0, 4);
    const recommendations = lists.slice(0, 2);

    const map = (l: (typeof lists)[0]) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description ?? '',
      coverImage: l.coverImage ?? '',
      saveCount: l.saveCount ?? 0,
      itemCount: l.itemCount ?? 0,
      likes: l.likeCount ?? 0,
      badge: l.isFeatured ? ('featured' as const) : (l.badge?.toLowerCase() as 'trending' | 'new' | 'featured') ?? undefined,
      categories: l.categories,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        featured: featured ? map(featured) : null,
        trending: trending.map(map),
        recommendations: recommendations.map(map),
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
