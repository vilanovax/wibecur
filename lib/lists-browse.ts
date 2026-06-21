import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { withResolvedListCovers } from '@/lib/resolve-list-cover';
import { publicCuratedListWhere } from '@/lib/public-content-filters';
import type { Prisma } from '@prisma/client';

export type ListsBrowseSort = 'newest' | 'popular' | 'most_saved' | 'rising';

export const LISTS_BROWSE_DEFAULT_LIMIT = 48;
export const LISTS_SSR_LIMIT = 120;

export const listsBrowseSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  horizontalImage: true,
  categoryId: true,
  badge: true,
  isPublic: true,
  isFeatured: true,
  isActive: true,
  viewCount: true,
  likeCount: true,
  saveCount: true,
  itemCount: true,
  createdAt: true,
  updatedAt: true,
  categories: true,
  users: {
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      role: true,
    },
  },
  _count: {
    select: { items: true, list_likes: true },
  },
} satisfies Prisma.listsSelect;

export type ListsBrowseRecord = Prisma.listsGetPayload<{ select: typeof listsBrowseSelect }>;

export type ListsBrowseList = Omit<ListsBrowseRecord, 'createdAt' | 'updatedAt' | 'coverImage'> & {
  coverImage: string;
  bannerImage: string;
  createdAt: string;
  updatedAt: string;
};

function browseOrderBy(sort: ListsBrowseSort): Prisma.listsOrderByWithRelationInput {
  switch (sort) {
    case 'popular':
      return { likeCount: 'desc' };
    case 'most_saved':
    case 'rising':
      return { saveCount: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

function serializeBrowseList(
  list: ListsBrowseRecord & { coverImage: string; bannerImage: string }
): ListsBrowseList {
  return {
    ...list,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}

export type FetchListsBrowseParams = {
  offset?: number;
  limit?: number;
  sort?: ListsBrowseSort;
  categoryId?: string | null;
};

export type ListsBrowseResult = {
  lists: ListsBrowseList[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export async function fetchListsBrowse({
  offset = 0,
  limit = LISTS_BROWSE_DEFAULT_LIMIT,
  sort = 'newest',
  categoryId = null,
}: FetchListsBrowseParams = {}): Promise<ListsBrowseResult> {
  const safeLimit = Math.min(Math.max(limit, 1), LISTS_SSR_LIMIT);
  const safeOffset = Math.max(offset, 0);

  const where: Prisma.listsWhereInput = {
    ...publicCuratedListWhere,
    ...(categoryId ? { categoryId } : {}),
  };

  const [total, rows] = await Promise.all([
    dbQuery(() => prisma.lists.count({ where })),
    dbQuery(() =>
      prisma.lists.findMany({
        where,
        select: listsBrowseSelect,
        orderBy: browseOrderBy(sort),
        skip: safeOffset,
        take: safeLimit,
      })
    ),
  ]);

  const lists = withResolvedListCovers(rows).map(serializeBrowseList);

  return {
    lists,
    pagination: {
      offset: safeOffset,
      limit: safeLimit,
      total,
      hasMore: safeOffset + lists.length < total,
    },
  };
}
