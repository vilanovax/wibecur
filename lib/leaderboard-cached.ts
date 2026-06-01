import { unstable_cache } from 'next/cache';
import { fetchLeaderboard, type LeaderboardType } from '@/lib/leaderboard';

const CACHE_SECONDS = 300;

export async function getCachedLeaderboard(
  type: LeaderboardType,
  categorySlug?: string | null
) {
  const cacheKey =
    type === 'category' && categorySlug
      ? `leaderboard-${type}-${categorySlug}`
      : `leaderboard-${type}`;

  const getCached = unstable_cache(
    () => fetchLeaderboard(type, categorySlug),
    [cacheKey],
    { revalidate: CACHE_SECONDS, tags: ['leaderboard', cacheKey] }
  );

  return getCached();
}
