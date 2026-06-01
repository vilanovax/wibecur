import { NextResponse } from 'next/server';
import { getCachedGlobalTrending } from '@/lib/trending/cached';
import { tryApiDbFallback } from '@/lib/api-db';

export async function GET() {
  try {
    const data = await getCachedGlobalTrending(6);

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
