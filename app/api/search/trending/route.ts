import { NextRequest, NextResponse } from 'next/server';
import { getTrendingSearchQueries } from '@/lib/search-analytics';

/** GET /api/search/trending?limit=6 — پرجستجوهای اخیر */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6', 10);
    const { queries, source } = await getTrendingSearchQueries(limit);

    const response = NextResponse.json({
      success: true,
      data: { queries, source },
    });
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
