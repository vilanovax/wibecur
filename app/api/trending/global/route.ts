import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getGlobalTrending } from '@/lib/trending/service';
import { tryApiDbFallback } from '@/lib/api-db';

const CACHE_SECONDS = 600;

export async function GET() {
  try {
    const getCached = unstable_cache(
      () => dbQuery(() => getGlobalTrending(prisma, 6)),
      ['trending-global-lists'],
      { revalidate: CACHE_SECONDS, tags: ['trending'] }
    );
    const data = await getCached();

    const res = NextResponse.json({ success: true, data });
    res.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return res;
  } catch (err) {
    const fb = tryApiDbFallback(err, [], 'Trending global');
    if (fb) {
      fb.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return fb;
    }
    console.error('Trending global error:', err);
    return NextResponse.json({ success: true, data: [] });
  }
}
