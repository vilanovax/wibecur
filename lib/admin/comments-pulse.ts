/**
 * Comments pulse counters for admin hub / lists.
 * Perf: one SQL for comment aggregates instead of 5× count() (async-parallel).
 */

import { Prisma } from '@prisma/client';
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

export async function getCommentsPulse(): Promise<CommentsPulseSummary> {
  const [commentAgg, unresolvedReports] = await dbQuery(() =>
    Promise.all([
      prisma.$queryRaw<
        {
          pending: number;
          approved: number;
          flagged: number;
          reported: number;
        }[]
      >(Prisma.sql`
        SELECT
          COUNT(*) FILTER (WHERE c."isApproved" = false)::int AS pending,
          COUNT(*) FILTER (WHERE c."isApproved" = true)::int AS approved,
          COUNT(*) FILTER (
            WHERE c."isFiltered" = true
              OR EXISTS (
                SELECT 1 FROM comment_reports r
                WHERE r."commentId" = c.id AND r.resolved = false
              )
          )::int AS flagged,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM comment_reports r
              WHERE r."commentId" = c.id AND r.resolved = false
            )
          )::int AS reported
        FROM comments c
        WHERE c."deletedAt" IS NULL
      `),
      prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM comment_reports r
        INNER JOIN comments c ON c.id = r."commentId"
        WHERE r.resolved = false
          AND c."deletedAt" IS NULL
      `),
    ])
  );

  const row = commentAgg[0];
  return {
    pending: row?.pending ?? 0,
    flagged: row?.flagged ?? 0,
    reported: row?.reported ?? 0,
    approved: row?.approved ?? 0,
    unresolvedReports: unresolvedReports[0]?.count ?? 0,
  };
}
