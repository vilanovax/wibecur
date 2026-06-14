import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCommentsPulse } from '@/lib/admin/comments-pulse';
import { getReportsPulse } from '@/lib/admin/comments-reports-intelligence';
import { getPenaltyThresholds } from '@/lib/comment-permission';

export type CommentsHubStats = {
  comments: Awaited<ReturnType<typeof getCommentsPulse>>;
  commentReports: Awaited<ReturnType<typeof getReportsPulse>>;
  itemReportsOpen: number;
  itemReportsTotal: number;
  filteredComments: number;
  violations: {
    totalOffenders: number;
    restrictedUsers: number;
    totalPenaltyScore: number;
  };
};

async function getViolationsHubCounts() {
  const thresholds = await getPenaltyThresholds();
  const now = new Date();

  const [totalOffenders, restrictedUsers, penaltySum] = await Promise.all([
    dbQuery(() =>
      prisma.user_violations.groupBy({
        by: ['userId'],
        _count: { _all: true },
      }).then((rows) => rows.length)
    ),
    dbQuery(() =>
      prisma.users.count({
        where: {
          OR: [
            { commentRestrictedUntil: { gt: now } },
            {
              user_violations: {
                some: { totalPenaltyScore: { gte: thresholds.restrict } },
              },
            },
          ],
        },
      })
    ),
    dbQuery(() =>
      prisma.user_violations.aggregate({
        _sum: { totalPenaltyScore: true },
      })
    ),
  ]);

  return {
    totalOffenders,
    restrictedUsers,
    totalPenaltyScore: penaltySum._sum.totalPenaltyScore ?? 0,
  };
}

export async function getCommentsHubStats(): Promise<CommentsHubStats> {
  const [
    comments,
    commentReports,
    itemReportsOpen,
    itemReportsTotal,
    itemCommentsFiltered,
    commentsFiltered,
    violations,
  ] = await Promise.all([
    getCommentsPulse(),
    getReportsPulse(),
    dbQuery(() =>
      prisma.item_reports.count({ where: { resolved: false } })
    ),
    dbQuery(() => prisma.item_reports.count()),
    dbQuery(() =>
      prisma.list_comments.count({
        where: { deletedAt: null, isFiltered: true },
      })
    ),
    dbQuery(() =>
      prisma.comments.count({
        where: { deletedAt: null, isFiltered: true },
      })
    ),
    getViolationsHubCounts(),
  ]);

  return {
    comments,
    commentReports,
    itemReportsOpen,
    itemReportsTotal,
    filteredComments: commentsFiltered + itemCommentsFiltered,
    violations,
  };
}
