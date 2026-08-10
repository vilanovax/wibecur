/**
 * Comments hub KPI / nav badge stats.
 *
 * Perf (vercel-react-best-practices):
 * - Drop unused full-table scans (filtered totals, itemReportsTotal, offenders groupBy)
 * - Reuse pulse.unresolvedReports for commentReports.open (no getReportsPulse×3)
 * - Parallelize penalty thresholds with other counts (no waterfall)
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCommentsPulse } from '@/lib/admin/comments-pulse';
import { getPenaltyThresholds } from '@/lib/comment-permission';

export type CommentsHubStats = {
  comments: Awaited<ReturnType<typeof getCommentsPulse>>;
  commentReports: {
    open: number;
    resolved: number;
    total: number;
  };
  itemReportsOpen: number;
  itemReportsTotal: number;
  filteredComments: number;
  violations: {
    totalOffenders: number;
    restrictedUsers: number;
    totalPenaltyScore: number;
  };
};

async function countRestrictedUsers(): Promise<number> {
  const thresholds = await getPenaltyThresholds();
  const now = new Date();
  return dbQuery(() =>
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
  );
}

export async function getCommentsHubStats(): Promise<CommentsHubStats> {
  const [comments, itemReportsOpen, restrictedUsers] = await Promise.all([
    getCommentsPulse(),
    dbQuery(() =>
      prisma.item_reports.count({ where: { resolved: false } })
    ),
    // Starts immediately; awaits thresholds internally (no outer waterfall)
    countRestrictedUsers(),
  ]);

  const openReports = comments.unresolvedReports;

  return {
    comments,
    commentReports: {
      open: openReports,
      // Unused by hub/nav UI — keep shape for type compat without extra queries
      resolved: 0,
      total: openReports,
    },
    itemReportsOpen,
    itemReportsTotal: itemReportsOpen,
    filteredComments: 0,
    violations: {
      totalOffenders: 0,
      restrictedUsers,
      totalPenaltyScore: 0,
    },
  };
}
