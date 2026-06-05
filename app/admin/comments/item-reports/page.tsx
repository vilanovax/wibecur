import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCachedCommentsHubStats } from '@/lib/admin/comments-hub-stats-cached';
import { parseCommentsPageSize } from '@/lib/admin/comments-page-size';
import CommentsPaginationBar from '@/components/admin/comments/CommentsPaginationBar';
import ItemReportsPageClient from './ItemReportsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'گزارش‌های آیتم‌ها | پنل مدیریت',
  description: 'مدیریت گزارش‌های ارسال شده برای آیتم‌ها',
};

export default async function ItemReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; resolved?: string; pageSize?: string }>;
}) {
  await requireAdmin();

  const { page = '1', resolved, pageSize: pageSizeParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = parseCommentsPageSize(pageSizeParam);

  const where: { resolved?: boolean } = {};
  if (resolved === 'false') where.resolved = false;
  else if (resolved === 'true') where.resolved = true;

  const [totalCount, reportsRaw, openCount, resolvedCount, totalAll, hubStats] =
    await Promise.all([
      dbQuery(() => prisma.item_reports.count({ where })),
      dbQuery(() =>
        prisma.item_reports.findMany({
          where,
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              select: { id: true, title: true, description: true },
            },
            users: {
              select: { id: true, name: true, email: true },
            },
          },
        })
      ),
      dbQuery(() => prisma.item_reports.count({ where: { resolved: false } })),
      dbQuery(() => prisma.item_reports.count({ where: { resolved: true } })),
      dbQuery(() => prisma.item_reports.count()),
      getCachedCommentsHubStats(),
    ]);

  const reports = reportsRaw.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginationParams: Record<string, string> = {};
  if (resolved) paginationParams.resolved = resolved;
  if (pageSize !== 10) paginationParams.pageSize = String(pageSize);

  const activeFilter =
    resolved === 'false' ? 'open' : resolved === 'true' ? 'resolved' : 'all';

  return (
    <>
      <ItemReportsPageClient
        reports={reports}
        counts={{ open: openCount, resolved: resolvedCount, total: totalAll }}
        activeFilter={activeFilter}
        navStats={{
          pending: hubStats.comments.pending,
          commentReportsOpen: hubStats.commentReports.open,
          itemReportsOpen: hubStats.itemReportsOpen,
        }}
      />
      <CommentsPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/comments/item-reports"
        searchParams={paginationParams}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </>
  );
}
