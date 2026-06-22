import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { parseCommentFilter, type CommentFilterKind } from '@/lib/admin/comments-filter-utils';
import {
  getCommentsPulse,
  type CommentsPulseSummary,
} from '@/lib/admin/comments-pulse';
import {
  DEFAULT_COMMENTS_PAGE_SIZE,
  parseCommentsPageSize,
  type CommentsPageSize,
} from '@/lib/admin/comments-page-size';
import {
  getUsersCommentModerationMeta,
  type CommentPermissionStatus,
} from '@/lib/comment-permission';

export { COMMENTS_PAGE_SIZE_OPTIONS } from '@/lib/admin/comments-page-size';
export const COMMENTS_PAGE_SIZE = DEFAULT_COMMENTS_PAGE_SIZE;

export type CommentSortKind =
  | 'created_desc'
  | 'created_asc'
  | 'reports_desc'
  | 'reports_asc'
  | 'likes_desc';

export const COMMENT_SORT_OPTIONS: { value: CommentSortKind; label: string }[] = [
  { value: 'created_desc', label: 'جدیدترین' },
  { value: 'created_asc', label: 'قدیمی‌ترین' },
  { value: 'reports_desc', label: 'بیشترین ریپورت' },
  { value: 'reports_asc', label: 'کمترین ریپورت' },
  { value: 'likes_desc', label: 'بیشترین لایک' },
];

export type CommentsIntelligenceQuery = {
  page: number;
  pageSize: CommentsPageSize;
  filter: CommentFilterKind;
  search: string;
  sort: CommentSortKind;
};

export type CommentListRow = {
  id: string;
  content: string;
  isFiltered: boolean;
  isApproved: boolean;
  isSeeded: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  userModeration?: {
    totalPenaltyScore: number;
    status: CommentPermissionStatus;
    restrictedUntil: string | null;
  };
  items: {
    id: string;
    title: string;
  };
  _count: {
    comment_reports: number;
  };
};

export type CommentsIntelligenceData = {
  comments: CommentListRow[];
  pulse: CommentsPulseSummary;
  badWords: string[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  filter: CommentFilterKind;
  search: string;
  sort: CommentSortKind;
};

const commentInclude = {
  users: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  items: {
    select: {
      id: true,
      title: true,
    },
  },
  _count: {
    select: {
      comment_reports: true,
    },
  },
} as const;

export function parseCommentSort(value: string | undefined): CommentSortKind {
  const valid = new Set(COMMENT_SORT_OPTIONS.map((o) => o.value));
  if (value && valid.has(value as CommentSortKind)) return value as CommentSortKind;
  return 'created_desc';
}

export function buildCommentsWhere(
  filter: CommentFilterKind,
  search: string
): Prisma.commentsWhereInput {
  const where: Prisma.commentsWhereInput = {};

  if (filter === 'approved') {
    where.deletedAt = null;
    where.isApproved = true;
  } else if (filter === 'pending') {
    where.deletedAt = null;
    where.isApproved = false;
  } else if (filter === 'rejected') {
    where.deletedAt = { not: null };
  } else if (filter === 'flagged') {
    where.deletedAt = null;
    where.OR = [
      { isFiltered: true },
      { comment_reports: { some: { resolved: false } } },
    ];
  } else if (filter === 'filtered') {
    where.deletedAt = null;
    where.isFiltered = true;
  } else if (filter === 'reported') {
    where.deletedAt = null;
    where.comment_reports = { some: { resolved: false } };
  } else if (filter === 'seeded') {
    where.deletedAt = null;
    where.isSeeded = true;
  } else {
    where.deletedAt = null;
  }

  if (search.trim()) {
    where.content = { contains: search.trim(), mode: 'insensitive' };
  }

  return where;
}

export function buildCommentsOrderBy(
  sort: CommentSortKind
): Prisma.commentsOrderByWithRelationInput[] {
  switch (sort) {
    case 'created_asc':
      return [{ createdAt: 'asc' }];
    case 'reports_desc':
      return [{ comment_reports: { _count: 'desc' } }, { createdAt: 'desc' }];
    case 'reports_asc':
      return [{ comment_reports: { _count: 'asc' } }, { createdAt: 'desc' }];
    case 'likes_desc':
      return [{ likeCount: 'desc' }, { createdAt: 'desc' }];
    case 'created_desc':
    default:
      return [{ createdAt: 'desc' }];
  }
}

function serializeComment(
  c: Awaited<
    ReturnType<
      typeof prisma.comments.findMany<{ include: typeof commentInclude }>
    >
  >[number]
): CommentListRow {
  return {
    id: c.id,
    content: c.content,
    isFiltered: c.isFiltered,
    isApproved: c.isApproved,
    isSeeded: c.isSeeded,
    likeCount: c.likeCount,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
    users: c.users,
    items: c.items,
    _count: c._count,
  };
}

export async function getCommentsIntelligenceData(
  raw: CommentsIntelligenceQuery
): Promise<CommentsIntelligenceData> {
  const filter = parseCommentFilter(raw.filter);
  const sort = parseCommentSort(raw.sort);
  const page = Math.max(1, raw.page);
  const pageSize = parseCommentsPageSize(
    raw.pageSize != null ? String(raw.pageSize) : undefined
  );
  const search = raw.search ?? '';
  const where = buildCommentsWhere(filter, search);
  const orderBy = buildCommentsOrderBy(sort);
  const skip = (page - 1) * pageSize;

  const [totalCount, comments, pulse, badWordsRows] = await Promise.all([
    dbQuery(() => prisma.comments.count({ where })),
    dbQuery(() =>
      prisma.comments.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: commentInclude,
      })
    ),
    getCommentsPulse(),
    dbQuery(() => prisma.bad_words.findMany({ select: { word: true } })),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const moderationMeta = await getUsersCommentModerationMeta(
    comments.map((c) => c.users.id)
  );

  return {
    comments: comments.map((c) => {
      const row = serializeComment(c);
      const meta = moderationMeta.get(c.users.id);
      return meta
        ? {
            ...row,
            userModeration: {
              totalPenaltyScore: meta.totalPenaltyScore,
              status: meta.status,
              restrictedUntil: meta.restrictedUntil,
            },
          }
        : row;
    }),
    pulse,
    badWords: badWordsRows.map((bw) => bw.word.toLowerCase()),
    totalCount,
    currentPage: page,
    totalPages,
    pageSize,
    filter,
    search,
    sort,
  };
}
