import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { getCachedCommentsIntelligenceData } from '@/lib/admin/comments-intelligence-cached';
import { getCachedCommentsHubStats } from '@/lib/admin/comments-hub-stats-cached';
import { parseCommentSort } from '@/lib/admin/comments-intelligence';
import { parseCommentFilter } from '@/lib/admin/comments-filter-utils';
import { parseCommentsPageSize } from '@/lib/admin/comments-page-size';
import CommentsPaginationBar from '@/components/admin/comments/CommentsPaginationBar';
import CommentsPageClient from '../CommentsPageClient';

export default async function CommentsAllPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    filter?: string;
    search?: string;
    sort?: string;
    pageSize?: string;
  }>;
}) {
  await requireAdmin();

  const {
    page = '1',
    filter: filterParam,
    search = '',
    sort: sortParam = '',
    pageSize: pageSizeParam,
  } = await searchParams;

  const filter = filterParam
    ? parseCommentFilter(filterParam)
    : 'pending';
  const pageSize = parseCommentsPageSize(pageSizeParam);

  const [data, hubStats] = await Promise.all([
    getCachedCommentsIntelligenceData({
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize,
      filter,
      search,
      sort: parseCommentSort(sortParam),
    }),
    getCachedCommentsHubStats(),
  ]);

  const paginationParams: Record<string, string> = {};
  if (data.filter !== 'pending') paginationParams.filter = data.filter;
  if (data.search) paginationParams.search = data.search;
  if (data.sort !== 'created_desc') paginationParams.sort = data.sort;
  if (data.pageSize !== 10) paginationParams.pageSize = String(data.pageSize);

  const navStats = {
    pending: hubStats.comments.pending,
    commentReportsOpen: hubStats.commentReports.open,
    itemReportsOpen: hubStats.itemReportsOpen,
  };

  return (
    <>
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
            در حال بارگذاری کامنت‌ها…
          </div>
        }
      >
        <CommentsPageClient data={data} navStats={navStats} />
      </Suspense>
      <CommentsPaginationBar
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        basePath="/admin/comments/all"
        searchParams={paginationParams}
        pageSize={pageSize}
        totalCount={data.totalCount}
      />
    </>
  );
}
