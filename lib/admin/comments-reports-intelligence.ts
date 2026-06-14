import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  DEFAULT_COMMENTS_PAGE_SIZE,
  type CommentsPageSize,
} from '@/lib/admin/comments-page-size';
import {
  getUsersCommentModerationMeta,
  type CommentPermissionStatus,
} from '@/lib/comment-permission';

export const DEFAULT_REPORTS_PAGE_SIZE = DEFAULT_COMMENTS_PAGE_SIZE;

export type ReportsResolvedFilter = 'all' | 'open' | 'resolved';

export type ReportsPulseSummary = {
  open: number;
  resolved: number;
  total: number;
};

export type ReportRow = {
  id: string;
  commentId: string;
  userId: string;
  reason: string | null;
  resolved: boolean;
  createdAt: string;
  users: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type ReportGroup = {
  comment: {
    id: string;
    content: string;
    isFiltered: boolean;
    isApproved: boolean;
    likeCount: number;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    users: {
      id: string;
      name: string | null;
      email: string;
    };
    items: {
      id: string;
      title: string;
    };
    userModeration?: {
      totalPenaltyScore: number;
      status: CommentPermissionStatus;
      restrictedUntil: string | null;
    };
  };
  reports: ReportRow[];
  reportCount: number;
};

export type CommentsReportsIntelligenceData = {
  groups: ReportGroup[];
  pulse: ReportsPulseSummary;
  badWords: string[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: CommentsPageSize;
  resolved: ReportsResolvedFilter;
};

export function parseReportsResolved(
  value: string | undefined
): ReportsResolvedFilter {
  if (value === 'false') return 'open';
  if (value === 'true') return 'resolved';
  if (value === 'all') return 'all';
  return 'all';
}

function buildReportRowsWhere(
  resolved: ReportsResolvedFilter
): Prisma.comment_reportsWhereInput {
  const where: Prisma.comment_reportsWhereInput = {};
  if (resolved === 'open') where.resolved = false;
  else if (resolved === 'resolved') where.resolved = true;
  return where;
}

function buildCommentsWithReportsWhere(
  resolved: ReportsResolvedFilter
): Prisma.commentsWhereInput {
  return {
    deletedAt: null,
    comment_reports: { some: buildReportRowsWhere(resolved) },
  };
}

export async function getReportsPulse(): Promise<ReportsPulseSummary> {
  const base = { comments: { deletedAt: null } } as const;
  const [open, resolved, total] = await Promise.all([
    dbQuery(() =>
      prisma.comment_reports.count({ where: { ...base, resolved: false } })
    ),
    dbQuery(() =>
      prisma.comment_reports.count({ where: { ...base, resolved: true } })
    ),
    dbQuery(() => prisma.comment_reports.count({ where: base })),
  ]);
  return { open, resolved, total };
}

export async function getCommentsReportsIntelligenceData(opts: {
  page: number;
  pageSize: CommentsPageSize;
  resolved: ReportsResolvedFilter;
}): Promise<CommentsReportsIntelligenceData> {
  const page = Math.max(1, opts.page);
  const pageSize = opts.pageSize;
  const commentsWhere = buildCommentsWithReportsWhere(opts.resolved);
  const reportRowsWhere = buildReportRowsWhere(opts.resolved);
  const skip = (page - 1) * pageSize;

  const [totalCount, commentsRaw, pulse, badWordsRows] = await Promise.all([
    dbQuery(() => prisma.comments.count({ where: commentsWhere })),
    dbQuery(() =>
      prisma.comments.findMany({
        where: commentsWhere,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          users: {
            select: { id: true, name: true, email: true },
          },
          items: {
            select: { id: true, title: true },
          },
          comment_reports: {
            where: reportRowsWhere,
            orderBy: { createdAt: 'desc' },
            include: {
              users: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      })
    ),
    getReportsPulse(),
    dbQuery(() => prisma.bad_words.findMany({ select: { word: true } })),
  ]);

  const moderationMeta = await getUsersCommentModerationMeta(
    commentsRaw.map((c) => c.users.id)
  );

  const groups: ReportGroup[] = commentsRaw.map((c) => {
    const meta = moderationMeta.get(c.users.id);
    return {
      comment: {
        id: c.id,
        content: c.content,
        isFiltered: c.isFiltered,
        isApproved: c.isApproved,
        likeCount: c.likeCount,
        deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        users: c.users,
        items: c.items,
        ...(meta
          ? {
              userModeration: {
                totalPenaltyScore: meta.totalPenaltyScore,
                status: meta.status,
                restrictedUntil: meta.restrictedUntil,
              },
            }
          : {}),
      },
      reports: c.comment_reports.map((report) => ({
        id: report.id,
        commentId: report.commentId,
        userId: report.userId,
        reason: report.reason,
        resolved: report.resolved,
        createdAt: report.createdAt.toISOString(),
        users: report.users,
      })),
      reportCount: c.comment_reports.length,
    };
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    groups,
    pulse,
    badWords: badWordsRows.map((bw) => bw.word.toLowerCase()),
    totalCount,
    currentPage: page,
    totalPages,
    pageSize,
    resolved: opts.resolved,
  };
}
