import { NextResponse } from 'next/server';
import { getCachedFastRising } from '@/lib/trending/cached';
import { tryApiDbFallback } from '@/lib/api-db';

export async function GET() {
  try {
    const data = await getCachedFastRising(6);

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
