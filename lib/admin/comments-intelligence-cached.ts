import { unstable_cache } from 'next/cache';
import { dbQuery } from '@/lib/db';
import {
  getCommentsIntelligenceData,
  type CommentsIntelligenceData,
  type CommentsIntelligenceQuery,
} from '@/lib/admin/comments-intelligence';
import {
  ADMIN_CACHE_TAGS,
  ADMIN_COMMENTS_CACHE_SECONDS,
} from '@/lib/admin/admin-cache';

function cacheKey(q: CommentsIntelligenceQuery): string[] {
  return [
    'admin-comments-intelligence',
    String(q.page),
    String(q.pageSize),
    q.filter,
    q.search,
    q.sort,
  ];
}

async function loadCommentsIntelligence(
  query: CommentsIntelligenceQuery
): Promise<CommentsIntelligenceData> {
  return dbQuery(() => getCommentsIntelligenceData(query));
}

export function getCachedCommentsIntelligenceData(
  query: CommentsIntelligenceQuery
): Promise<CommentsIntelligenceData> {
  const getCached = unstable_cache(
    () => loadCommentsIntelligence(query),
    cacheKey(query),
    {
      revalidate: ADMIN_COMMENTS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.comments],
    }
  );
  return getCached();
}
