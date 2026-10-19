import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import {
  getCommentsHubPriorityItems,
  type HubPriorityItem,
} from './comments-hub-priority';
import { ADMIN_CACHE_TAGS, ADMIN_COMMENTS_CACHE_SECONDS } from './admin-cache';

function getCrossRequestCachedPriority(limit: number) {
  return unstable_cache(
    () => getCommentsHubPriorityItems(limit),
    ['admin-comments-hub-priority', String(limit)],
    {
      revalidate: ADMIN_COMMENTS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.comments],
    }
  )();
}

/** Per-request dedupe + short TTL */
export const getCachedCommentsHubPriorityItems = cache(
  (limit = 5): Promise<HubPriorityItem[]> =>
    getCrossRequestCachedPriority(limit)
);
