import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { getCachedCommentsHubStats } from '@/lib/admin/comments-hub-stats-cached';
import { buildCommentsNavStats } from '@/lib/admin/comments-nav-stats';
import { parseCommentsPageSize } from '@/lib/admin/comments-page-size';
import CommentsPaginationBar from '@/components/admin/comments/CommentsPaginationBar';
import ViolationsPageClient from './ViolationsPageClient';
import {
  getPenaltyThresholds,
  resolveCommentStatus,
} from '@/lib/comment-permission';
import {
  buildViolationsStatusWhere,
  parseViolationStatusFilter,
} from '@/lib/admin/violations-filter';

export default async function ViolationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    pageSize?: string;
    status?: string;
  }>;
}) {
  await requireAdmin();
  const hubStats = await getCachedCommentsHubStats();
  const thresholds = await getPenaltyThresholds();

  const {
    page = '1',
    search = '',
    pageSize: pageSizeParam,
    status: statusParam,
  } = await searchParams;

  const statusFilter = parseViolationStatusFilter(statusParam);
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = parseCommentsPageSize(pageSizeParam);
  const skip = (currentPage - 1) * pageSize;
  const searchTrim = search.trim();
  const now = new Date();

  const statusWhere = buildViolationsStatusWhere(statusFilter, thresholds, now);

  const where: Prisma.user_violationsWhereInput = searchTrim
    ? {
        AND: [
          statusWhere,
          {
            users: {
              OR: [
                { name: { contains: searchTrim, mode: 'insensitive' } },
                { email: { contains: searchTrim, mode: 'insensitive' } },
              ],
            },
          },
        ],
      }
    : statusWhere;

  const [totalCount, violations, aggregates] = await Promise.all([
    prisma.user_violations.count({ where }),
    prisma.user_violations.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ violationCount: 'desc' }, { totalPenaltyScore: 'desc' }],
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            isActive: true,
            commentRestrictedUntil: true,
            commentBanReason: true,
          },
        },
      },
    }),
    prisma.user_violations.aggregate({
      where,
      _count: { _all: true },
      _sum: { violationCount: true, totalPenaltyScore: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const serializedViolations = violations.map((v) => ({
    id: v.id,
    violationCount: v.violationCount,
    totalPenaltyScore: v.totalPenaltyScore || 0,
    lastViolationDate: v.lastViolationDate.toISOString(),
    commentStatus: resolveCommentStatus(
      v.totalPenaltyScore || 0,
      v.users.commentRestrictedUntil,
      v.users.isActive,
      thresholds
    ),
    user: {
      ...v.users,
      createdAt: v.users.createdAt.toISOString(),
      commentRestrictedUntil: v.users.commentRestrictedUntil?.toISOString() ?? null,
    },
  }));

  const paginationParams: Record<string, string> = {};
  if (searchTrim) paginationParams.search = searchTrim;
  if (statusFilter !== 'all') paginationParams.status = statusFilter;
  if (pageSize !== 10) paginationParams.pageSize = String(pageSize);

  return (
    <>
      <ViolationsPageClient
        violations={serializedViolations}
        stats={{
          totalOffenders: aggregates._count._all,
          totalViolations: aggregates._sum.violationCount ?? 0,
          totalPenalty: aggregates._sum.totalPenaltyScore ?? 0,
        }}
        search={searchTrim}
        statusFilter={statusFilter}
        navStats={buildCommentsNavStats(hubStats)}
      />
      <CommentsPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/comments/violations"
        searchParams={paginationParams}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </>
  );
}
