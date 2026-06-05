import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

export type CommentsPulseSummary = {
  pending: number;
  flagged: number;
  reported: number;
  approved: number;
  unresolvedReports: number;
};

export type CommentsPulseFilterKey = keyof Pick<
  CommentsPulseSummary,
  'pending' | 'flagged' | 'reported' | 'approved'
>;

export const PULSE_TO_FILTER: Record<CommentsPulseFilterKey, string> = {
  pending: 'pending',
  flagged: 'flagged',
  reported: 'reported',
  approved: 'approved',
};

const activeOnly = { deletedAt: null } as const;

export async function getCommentsPulse(): Promise<CommentsPulseSummary> {
  const [
    pending,
    flagged,
    reported,
    approved,
    unresolvedReports,
  ] = await Promise.all([
    dbQuery(() =>
      prisma.comments.count({
        where: { ...activeOnly, isApproved: false },
      })
    ),
    dbQuery(() =>
      prisma.comments.count({
        where: {
          ...activeOnly,
          OR: [
            { isFiltered: true },
            { comment_reports: { some: { resolved: false } } },
          ],
        },
      })
    ),
    dbQuery(() =>
      prisma.comments.count({
        where: {
          ...activeOnly,
          comment_reports: { some: { resolved: false } },
        },
      })
    ),
    dbQuery(() =>
      prisma.comments.count({
        where: { ...activeOnly, isApproved: true },
      })
    ),
    dbQuery(() =>
      prisma.comment_reports.count({ where: { resolved: false } })
    ),
  ]);

  return {
    pending,
    flagged,
    reported,
    approved,
    unresolvedReports,
  };
}
