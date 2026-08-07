import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { tryApiDbFallback } from '@/lib/api-db';
import {
  fetchListsBrowse,
  LISTS_BROWSE_DEFAULT_LIMIT,
  type ListsBrowseSort,
} from '@/lib/lists-browse';

const VALID_SORTS = new Set<ListsBrowseSort>(['newest', 'popular', 'most_saved', 'rising']);

/** GET /api/lists/browse — لیست‌های کیوریتد با pagination */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || String(LISTS_BROWSE_DEFAULT_LIMIT), 10);
    const sortParam = searchParams.get('sort') || 'newest';
    const sort = VALID_SORTS.has(sortParam as ListsBrowseSort)
      ? (sortParam as ListsBrowseSort)
      : 'newest';
    const categoryId = searchParams.get('categoryId');

    const result = await fetchListsBrowse({
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : LISTS_BROWSE_DEFAULT_LIMIT,
      sort,
      categoryId,
    });

    const response = NextResponse.json({ success: true, ...result });
    response.headers.set(
      'Cache-Control',
      'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
    );
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(
      error,
      {
        success: true,
        lists: [],
        pagination: { offset: 0, limit: LISTS_BROWSE_DEFAULT_LIMIT, total: 0, hasMore: false },
      },
      'Lists browse'
    );
    if (fb) {
      fb.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
      return fb;
    }
    console.error('Error fetching browse lists:', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در دریافت لیست‌ها') },
      { status: 500 }
    );
  }
}
