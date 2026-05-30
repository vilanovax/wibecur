import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { tryApiDbFallback } from '@/lib/api-db';
import { normalizeSearchQuery, SEARCH_MIN_LENGTH } from '@/lib/list-search';
import { withResolvedListCovers } from '@/lib/resolve-list-cover';

/** GET /api/lists/search?q=...&limit=8 — جستجوی سریع لیست‌ها */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = normalizeSearchQuery(searchParams.get('q') ?? '');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '8', 10) || 8, 1), 24);

    if (q.length < SEARCH_MIN_LENGTH) {
      return NextResponse.json({
        success: true,
        data: { lists: [], query: q, total: 0 },
      });
    }

    const lists = await dbQuery(() =>
      prisma.lists.findMany({
        where: {
          isActive: true,
          isPublic: true,
          users: { role: { not: 'USER' } },
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { categories: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
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

    const total = await dbQuery(() =>
      prisma.lists.count({
        where: {
          isActive: true,
          isPublic: true,
          users: { role: { not: 'USER' } },
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { categories: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
      })
    );

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
      { success: false, error: (error as Error)?.message || 'خطا در جستجو' },
      { status: 500 }
    );
  }
}
