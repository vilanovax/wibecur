/**
 * Lean moderation snapshot for the admin dashboard.
 * Avoids the full comments hub (violations + unused report totals).
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCommentsPulse } from '@/lib/admin/comments-pulse';
import type { CommentsModerationSnapshot } from './types';

export async function getDashboardModerationSnapshot(): Promise<CommentsModerationSnapshot> {
  const [comments, itemReportsOpen, itemCommentsFiltered, commentsFiltered] =
    await Promise.all([
      getCommentsPulse(),
      dbQuery(() =>
        prisma.item_reports.count({ where: { resolved: false } })
      ),
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
    ]);

  return {
    pending: comments.pending,
    flagged: comments.flagged,
    reported: comments.reported,
    filtered: commentsFiltered + itemCommentsFiltered,
    approved: comments.approved,
    unresolvedCommentReports: comments.unresolvedReports,
    unresolvedItemReports: itemReportsOpen,
    // UI does not show total; keep field for type compatibility without an extra query
    totalCommentReports: comments.unresolvedReports,
  };
}
