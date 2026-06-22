import { NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId, tryApiDbFallback } from '@/lib/api-db';
import {
  EMPTY_EXPLORE_USER_PREFERENCES,
  fetchExploreUserPreferences,
} from '@/lib/curated/explore-data';

/**
 * GET /api/explore/preferences
 * ترجیحات شخصی‌سازی اکسپلور — فقط برای کاربر لاگین‌شده
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
      console.warn('Explore preferences auth lookup failed:', authErr);
    }

    if (!userId) {
      return NextResponse.json(
        { success: true, data: EMPTY_EXPLORE_USER_PREFERENCES },
        { headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const data = await fetchExploreUserPreferences(userId);
    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=300' } }
    );
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, EMPTY_EXPLORE_USER_PREFERENCES, 'Explore preferences');
    if (fb) {
      fb.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');
      return fb;
    }
    console.error('Error fetching explore preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: getClientErrorMessage(error, 'خطا در دریافت ترجیحات اکسپلور'),
      },
      { status: 500 }
    );
  }
}
