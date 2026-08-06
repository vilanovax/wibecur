import 'server-only';

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { withResolvedListCovers } from '@/lib/resolve-list-cover';
import { publicCuratedListWhere } from '@/lib/public-content-filters';
import type { Prisma } from '@prisma/client';
import {
  LISTS_BROWSE_CACHE_TAG,
  LISTS_BROWSE_DEFAULT_LIMIT,
  LISTS_BROWSE_MAX_LIMIT,
  LISTS_SSR_LIMIT,
  type ListsBrowseList,
  type ListsBrowseResult,
  type ListsBrowseSort,
} from '@/lib/lists-browse-shared';

export {
  LISTS_BROWSE_CACHE_TAG,
  LISTS_BROWSE_DEFAULT_LIMIT,
  LISTS_BROWSE_MAX_LIMIT,
  LISTS_SSR_LIMIT,
  type ListsBrowseList,
  type ListsBrowseResult,
  type ListsBrowseSort,
};

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
  categories: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
    },
  },
  users: {
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      role: true,
    },
  },
} satisfies Prisma.listsSelect;

export type ListsBrowseRecord = Prisma.listsGetPayload<{ select: typeof listsBrowseSelect }>;

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

async function loadListsBrowse(
  safeOffset: number,
  safeLimit: number,
  sort: ListsBrowseSort,
  categoryId: string | null
): Promise<ListsBrowseResult> {
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

export async function fetchListsBrowse({
  offset = 0,
  limit = LISTS_BROWSE_DEFAULT_LIMIT,
  sort = 'newest',
  categoryId = null,
}: FetchListsBrowseParams = {}): Promise<ListsBrowseResult> {
  const safeLimit = Math.min(Math.max(limit, 1), LISTS_BROWSE_MAX_LIMIT);
  const safeOffset = Math.max(offset, 0);
  const cacheCategoryKey = categoryId ?? 'all';

  return unstable_cache(
    () => loadListsBrowse(safeOffset, safeLimit, sort, categoryId),
    ['lists-browse', String(safeOffset), String(safeLimit), sort, cacheCategoryKey],
    { revalidate: 60, tags: [LISTS_BROWSE_CACHE_TAG] }
  )();
}
