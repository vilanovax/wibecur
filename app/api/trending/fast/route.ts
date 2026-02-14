import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getFastRising } from '@/lib/trending/service';

const CACHE_SECONDS = 300; // 5 min - سریع‌تر ریفرش برای Fast Rising

export async function GET() {
  try {
    const getCached = unstable_cache(
      () => getFastRising(prisma, 6),
      ['trending-fast-rising'],
      { revalidate: CACHE_SECONDS, tags: ['trending'] }
    );
    const data = await getCached();

    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=300');
    return res;
  } catch (err) {
    console.error('Trending fast error:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت ترندها' },
      { status: 500 }
    );
  }
}
