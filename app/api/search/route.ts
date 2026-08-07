import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';
import { tryApiDbFallback } from '@/lib/api-db';
import { unifiedSearch } from '@/lib/unified-search';

const EMPTY = {
  query: '',
  queryIntent: 'specific' as const,
  items: [],
  directItems: [],
  indirectItems: [],
  topPicks: [],
  subThemes: [],
  lists: [],
  directLists: [],
  indirectLists: [],
  relatedItems: [],
  similarItems: [],
  totals: { items: 0, lists: 0 },
  hasMore: { directItems: false, indirectItems: false, lists: false },
};

/** GET /api/search?q=...&listLimit=8&itemLimit=6 — جستجوی یکپارچه آیتم + لیست */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const listLimit = parseInt(searchParams.get('listLimit') || '5', 10);
    const listOffset = parseInt(searchParams.get('listOffset') || '0', 10);
    const itemLimit = parseInt(searchParams.get('itemLimit') || '10', 10);
    const directItemLimit = parseInt(searchParams.get('directItemLimit') || String(itemLimit), 10);
    const directItemOffset = parseInt(searchParams.get('directItemOffset') || '0', 10);
    const indirectItemLimit = parseInt(searchParams.get('indirectItemLimit') || '0', 10);
    const indirectItemOffset = parseInt(searchParams.get('indirectItemOffset') || '0', 10);
    const relatedLimit = parseInt(
      searchParams.get('relatedLimit') || searchParams.get('similarLimit') || '0',
      10
    );
    const fast = searchParams.get('fast') === '1';

    const data = await unifiedSearch(prisma, q, {
      listLimit,
      listOffset,
      itemLimit,
      directItemLimit,
      directItemOffset,
      indirectItemLimit,
      indirectItemOffset,
      relatedLimit,
      fast: fast || undefined,
    });

    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, EMPTY, 'Unified search');
    if (fb) return fb;

    console.error('Unified search error:', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در جستجو') },
      { status: 500 }
    );
  }
}
