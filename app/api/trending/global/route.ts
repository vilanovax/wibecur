import { NextRequest, NextResponse } from 'next/server';
import { getCachedGlobalTrending } from '@/lib/trending/cached';
import { tryApiDbFallback } from '@/lib/api-db';

/**
 * GET /api/trending/global?limit=24
 * Default 24 for lists browse filter; home cards can pass limit=6.
 */
export async function GET(request: NextRequest) {
  try {
    const raw = parseInt(request.nextUrl.searchParams.get('limit') || '24', 10);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 48) : 24;
    const data = await getCachedGlobalTrending(limit);

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
