import { NextRequest, NextResponse } from 'next/server';
import type { LeaderboardType } from '@/lib/leaderboard';
import { getCachedLeaderboard } from '@/lib/leaderboard-cached';

/** GET /api/leaderboard?type=global|rising|category|monthly&category=film */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'global') as LeaderboardType;
    const categorySlug = searchParams.get('category')?.trim();

    if (type === 'category' && !categorySlug) {
      return NextResponse.json(
        { success: false, error: 'category required when type=category' },
        { status: 400 }
      );
    }

    const list = await getCachedLeaderboard(type, categorySlug ?? null);

    const res = NextResponse.json({ success: true, data: list });
    res.headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=300');
    return res;
  } catch (e) {
    console.error('Leaderboard error:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
