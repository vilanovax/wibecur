import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { logSearchQuery } from '@/lib/search-analytics';
import { normalizeSearchQuery, SEARCH_MIN_LENGTH } from '@/lib/list-search';

/** POST /api/search/log — ثبت جستجو برای analytics داخلی */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body.query === 'string' ? body.query : '';
    const source = typeof body.source === 'string' ? body.source : undefined;

    const normalized = normalizeSearchQuery(query);
    if (normalized.length < SEARCH_MIN_LENGTH) {
      return NextResponse.json({ success: true, data: { logged: false } });
    }

    await logSearchQuery(query, source);

    return NextResponse.json({ success: true, data: { logged: true } });
  } catch (error: unknown) {
    const message = getClientErrorMessage(error, 'Internal server error');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
