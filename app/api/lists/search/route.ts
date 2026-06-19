import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { tryApiDbFallback } from '@/lib/api-db';
import { normalizeSearchQuery, SEARCH_MIN_LENGTH } from '@/lib/list-search';
import { withResolvedListCovers } from '@/lib/resolve-list-cover';
import { buildPublicListSearchWhere } from '@/lib/public-list-search';

/** GET /api/lists/search?q=...&limit=8 — جستجوی سریع لیست‌ها */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = normalizeSearchQuery(searchParams.get('q') ?? '');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '8', 10) || 8, 1), 200);

    if (q.length < SEARCH_MIN_LENGTH) {
      return NextResponse.json({
        success: true,
        data: { lists: [], query: q, total: 0 },
      });
    }

    const searchWhere = buildPublicListSearchWhere(q);

    const lists = await dbQuery(() =>
      prisma.lists.findMany({
        where: searchWhere,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          saveCount: true,
          itemCount: true,
          badge: true,
          categories: {
            select: { name: true, icon: true, slug: true },
          },
        },
        orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      })
    );

    const total = await dbQuery(() => prisma.lists.count({ where: searchWhere }));

    const resolved = withResolvedListCovers(lists);

    const response = NextResponse.json({
      success: true,
      data: {
        lists: resolved,
        query: q,
        total,
      },
    });
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, { lists: [], query: '', total: 0 }, 'Lists search');
    if (fb) return fb;

    console.error('Error searching lists:', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در جستجو') },
      { status: 500 }
    );
  }
}
