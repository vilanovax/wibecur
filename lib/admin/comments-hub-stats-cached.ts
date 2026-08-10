import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getCommentsHubStats, type CommentsHubStats } from './comments-hub-stats';
import { ADMIN_CACHE_TAGS, ADMIN_COMMENTS_CACHE_SECONDS } from './admin-cache';

function getCrossRequestCachedCommentsHubStats() {
  return unstable_cache(
    () => getCommentsHubStats(),
    ['admin-comments-hub-stats'],
    {
      revalidate: ADMIN_COMMENTS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.comments],
    }
  )();
}

/** Per-request dedupe + short TTL cross-request cache */
export const getCachedCommentsHubStats = cache(
  (): Promise<CommentsHubStats> => getCrossRequestCachedCommentsHubStats()
);
