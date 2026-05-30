import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getFastRising } from '@/lib/trending/service';
import { tryApiDbFallback } from '@/lib/api-db';

const CACHE_SECONDS = 300;

export async function GET() {
  try {
    const getCached = unstable_cache(
      () => dbQuery(() => getFastRising(prisma, 6)),
      ['trending-fast-rising'],
      { revalidate: CACHE_SECONDS, tags: ['trending'] }
    );
    const data = await getCached();

    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=300');
    return res;
  } catch (err) {
    const fb = tryApiDbFallback(err, [], 'Trending fast');
    if (fb) {
      fb.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return fb;
    }
    console.error('Trending fast error:', err);
    return NextResponse.json({ success: true, data: [] });
  }
}
