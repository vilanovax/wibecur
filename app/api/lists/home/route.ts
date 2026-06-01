import { NextResponse } from 'next/server';
import { fetchHomePageData } from '@/lib/home-data-server';
import { tryApiDbFallback } from '@/lib/api-db';

const EMPTY_HOME = {
  featured: null,
  featuredSlotId: null,
  trending: [] as unknown[],
  rising: [] as unknown[],
  recommendations: [] as unknown[],
};

/**
 * GET /api/lists/home
 * لیست‌های عمومی برای صفحهٔ اول: featured + trending + rising + recommendations.
 */
export async function GET() {
  try {
    const data = await fetchHomePageData();

    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return response;
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, EMPTY_HOME, 'Home lists');
    if (fb) {
      fb.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return fb;
    }
    console.error('Error fetching home lists:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message ?? 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}
