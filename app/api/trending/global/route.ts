import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getGlobalTrending } from '@/lib/trending/service';

const CACHE_SECONDS = 600; // 10 min

export async function GET() {
  try {
    const getCached = unstable_cache(
      () => getGlobalTrending(prisma, 6),
      ['trending-global-lists'],
      { revalidate: CACHE_SECONDS, tags: ['trending'] }
    );
    const data = await getCached();

    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return res;
  } catch (err) {
    console.error('Trending global error:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت ترندها' },
      { status: 500 }
    );
  }
}
