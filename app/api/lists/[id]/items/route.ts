import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { tryApiDbFallback } from '@/lib/api-db';
import {
  fetchPublicListItemsPage,
  LIST_DETAIL_ITEMS_PAGE_SIZE,
} from '@/lib/list-detail-items';

/** GET /api/lists/[id]/items — صفحه‌بندی آیتم‌های لیست کیوریتد عمومی */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(
      searchParams.get('limit') || String(LIST_DETAIL_ITEMS_PAGE_SIZE),
      10
    );

    const result = await fetchPublicListItemsPage({
      listId: id,
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : LIST_DETAIL_ITEMS_PAGE_SIZE,
    });

    if (!result) {
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, ...result });
    response.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=120, stale-while-revalidate=300'
    );
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(
      error,
      { success: false, items: [], pagination: null },
      'list-items'
    );
    if (fb) return fb;
    console.error('list items page error:', error);
    return NextResponse.json(
      { error: getClientErrorMessage(error, 'خطا در دریافت آیتم‌ها') },
      { status: 500 }
    );
  }
}
