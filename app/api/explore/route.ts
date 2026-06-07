import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId, tryApiDbFallback } from '@/lib/api-db';
import { fetchExploreData } from '@/lib/curated/explore-data';

const EMPTY_EXPLORE = {
  lists: [],
  categories: [],
  preferredCategoryIds: [],
  bookmarkedListIds: [],
};

/**
 * GET /api/explore
 * لیست‌ها و دسته‌ها برای صفحهٔ اکسپلور + ترجیحات کاربر (در صورت لاگین)
 */
export async function GET() {
  try {
    let userId: string | null = null;
    try {
      const session = await auth();
      if (session?.user) {
        userId = await resolveSessionUserId(session);
      }
    } catch (authErr) {
      console.warn('Explore auth lookup failed:', authErr);
    }

    const data = await fetchExploreData(userId);

    const response = NextResponse.json({ success: true, data });
    // مهمان: payload یکسان و بدون personalization → قابل کش عمومی روی CDN.
    // لاگین: private چون preferred/bookmarked مخصوص کاربر است.
    response.headers.set(
      'Cache-Control',
      userId
        ? 'private, max-age=120, stale-while-revalidate=300'
        : 'public, s-maxage=120, stale-while-revalidate=300'
    );
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, EMPTY_EXPLORE, 'Explore');
    if (fb) {
      fb.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return fb;
    }
    console.error('Error fetching explore data:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message ?? 'خطا در دریافت اکسپلور' },
      { status: 500 }
    );
  }
}
