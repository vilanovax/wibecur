import { NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { tryApiDbFallback } from '@/lib/api-db';
import {
  EMPTY_EXPLORE_USER_PREFERENCES,
  fetchExploreBasePayload,
} from '@/lib/curated/explore-data';

const EMPTY_BASE = {
  lists: [],
  categories: [],
  ...EMPTY_EXPLORE_USER_PREFERENCES,
};

/**
 * GET /api/explore/base
 * لیست‌ها و دسته‌ها بدون personalization — قابل کش عمومی
 */
export async function GET() {
  try {
    const base = await fetchExploreBasePayload();
    const data = { ...base, ...EMPTY_EXPLORE_USER_PREFERENCES };
    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, EMPTY_BASE, 'Explore base');
    if (fb) {
      fb.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return fb;
    }
    console.error('Error fetching explore base:', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در دریافت اکسپلور') },
      { status: 500 }
    );
  }
}
