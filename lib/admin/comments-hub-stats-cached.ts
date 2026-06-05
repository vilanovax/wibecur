import { unstable_cache } from 'next/cache';
import { getCommentsHubStats, type CommentsHubStats } from './comments-hub-stats';
import { ADMIN_CACHE_TAGS, ADMIN_COMMENTS_CACHE_SECONDS } from './admin-cache';

export function getCachedCommentsHubStats(): Promise<CommentsHubStats> {
  return unstable_cache(
    () => getCommentsHubStats(),
    ['admin-comments-hub-stats'],
    {
      revalidate: ADMIN_COMMENTS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.comments],
    }
  )();
}
