import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getGlobalTrending, getFastRising } from '@/lib/trending/service';

const GLOBAL_CACHE_SECONDS = 600;
const FAST_CACHE_SECONDS = 300;

export async function getCachedGlobalTrending(limit = 6) {
  const getCached = unstable_cache(
    () => dbQuery(() => getGlobalTrending(prisma, limit)),
    ['trending-global-lists', String(limit)],
    { revalidate: GLOBAL_CACHE_SECONDS, tags: ['trending'] }
  );
  return getCached();
}

export async function getCachedFastRising(limit = 6) {
  const getCached = unstable_cache(
    () => dbQuery(() => getFastRising(prisma, limit)),
    ['trending-fast-rising', String(limit)],
    { revalidate: FAST_CACHE_SECONDS, tags: ['trending'] }
  );
  return getCached();
}
