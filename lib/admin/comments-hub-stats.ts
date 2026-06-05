import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCommentsPulse } from '@/lib/admin/comments-pulse';
import { getReportsPulse } from '@/lib/admin/comments-reports-intelligence';

export type CommentsHubStats = {
  comments: Awaited<ReturnType<typeof getCommentsPulse>>;
  commentReports: Awaited<ReturnType<typeof getReportsPulse>>;
  itemReportsOpen: number;
  itemReportsTotal: number;
  filteredComments: number;
};

export async function getCommentsHubStats(): Promise<CommentsHubStats> {
  const [comments, commentReports, itemReportsOpen, itemReportsTotal, filteredComments] =
    await Promise.all([
      getCommentsPulse(),
      getReportsPulse(),
      dbQuery(() =>
        prisma.item_reports.count({ where: { resolved: false } })
      ),
      dbQuery(() => prisma.item_reports.count()),
      dbQuery(() =>
        prisma.comments.count({
          where: { deletedAt: null, isFiltered: true },
        })
      ),
    ]);

  return {
    comments,
    commentReports,
    itemReportsOpen,
    itemReportsTotal,
    filteredComments,
  };
}
