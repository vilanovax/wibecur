import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { getCachedCommentsReportsIntelligenceData } from '@/lib/admin/comments-reports-intelligence-cached';
import { getCachedCommentsHubStats } from '@/lib/admin/comments-hub-stats-cached';
import { parseReportsResolved } from '@/lib/admin/comments-reports-intelligence';
import { parseCommentsPageSize } from '@/lib/admin/comments-page-size';
import CommentsPaginationBar from '@/components/admin/comments/CommentsPaginationBar';
import ReportsPageClient from './ReportsPageClient';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; resolved?: string; pageSize?: string }>;
}) {
  await requireAdmin();

  const {
    page = '1',
    resolved: resolvedParam,
    pageSize: pageSizeParam,
  } = await searchParams;

  const resolved = resolvedParam
    ? parseReportsResolved(resolvedParam)
    : 'open';
  const pageSize = parseCommentsPageSize(pageSizeParam);

  const [data, hubStats] = await Promise.all([
    getCachedCommentsReportsIntelligenceData({
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize,
      resolved,
    }),
    getCachedCommentsHubStats(),
  ]);

  const navStats = {
    pending: hubStats.comments.pending,
    commentReportsOpen: hubStats.commentReports.open,
    itemReportsOpen: hubStats.itemReportsOpen,
  };

  const paginationParams: Record<string, string> = {
    resolved:
      data.resolved === 'open'
        ? 'false'
        : data.resolved === 'resolved'
          ? 'true'
          : 'all',
  };
  if (data.pageSize !== 10) paginationParams.pageSize = String(data.pageSize);

  return (
    <>
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
            در حال بارگذاری ریپورت‌ها…
          </div>
        }
      >
        <ReportsPageClient data={data} navStats={navStats} />
      </Suspense>
      <CommentsPaginationBar
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        basePath="/admin/comments/reports"
        searchParams={paginationParams}
        pageSize={data.pageSize}
        totalCount={data.totalCount}
      />
    </>
  );
}
