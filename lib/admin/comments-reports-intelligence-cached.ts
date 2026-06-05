import { unstable_cache } from 'next/cache';
import { dbQuery } from '@/lib/db';
import {
  getCommentsReportsIntelligenceData,
  type CommentsReportsIntelligenceData,
  type ReportsResolvedFilter,
} from '@/lib/admin/comments-reports-intelligence';
import type { CommentsPageSize } from '@/lib/admin/comments-page-size';
import {
  ADMIN_CACHE_TAGS,
  ADMIN_COMMENTS_CACHE_SECONDS,
} from '@/lib/admin/admin-cache';

function cacheKey(
  page: number,
  pageSize: CommentsPageSize,
  resolved: ReportsResolvedFilter
): string[] {
  return ['admin-comments-reports', String(page), String(pageSize), resolved];
}

export function getCachedCommentsReportsIntelligenceData(opts: {
  page: number;
  pageSize: CommentsPageSize;
  resolved: ReportsResolvedFilter;
}): Promise<CommentsReportsIntelligenceData> {
  const getCached = unstable_cache(
    () => dbQuery(() => getCommentsReportsIntelligenceData(opts)),
    cacheKey(opts.page, opts.pageSize, opts.resolved),
    {
      revalidate: ADMIN_COMMENTS_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.comments, ADMIN_CACHE_TAGS.commentReports],
    }
  );
  return getCached();
}
