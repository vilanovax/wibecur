import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getMonthlyPopular } from '@/lib/trending/service';

const CACHE_SECONDS = 900; // 15 min

export async function GET() {
  try {
    const getCached = unstable_cache(
      () => getMonthlyPopular(prisma, 12),
      ['trending-monthly-popular'],
      { revalidate: CACHE_SECONDS, tags: ['trending'] }
    );
    const data = await getCached();

    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=900');
    return res;
  } catch (err) {
    console.error('Monthly popular error:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست‌های منتخب' },
      { status: 500 }
    );
  }
}
