import 'server-only';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { prepareListDetailForClient } from '@/lib/list-detail-serialize';
import { withResolvedItemImages } from '@/lib/resolve-item-image';
import { publicCuratedListWhere } from '@/lib/public-content-filters';
import { getListAccessForUser } from '@/lib/list-collaboration';
import {
  LIST_DETAIL_ITEMS_MAX_LIMIT,
  LIST_DETAIL_ITEMS_PAGE_SIZE,
} from '@/lib/list-detail-items-shared';

export {
  LIST_DETAIL_SSR_ITEM_LIMIT,
  USER_LIST_DETAIL_SSR_ITEM_LIMIT,
  LIST_DETAIL_ITEMS_PAGE_SIZE,
  LIST_DETAIL_ITEMS_MAX_LIMIT,
} from '@/lib/list-detail-items-shared';

export const listDetailItemSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  externalUrl: true,
  catalogItemId: true,
  listNote: true,
  rating: true,
  voteCount: true,
  metadata: true,
  order: true,
} as const;

export type ListDetailItemRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  catalogItemId: string | null;
  listNote: string | null;
  rating: number | null;
  voteCount: number | null;
  metadata: unknown;
  order?: number;
};

export async function fetchPublicListItemsPage(params: {
  listId: string;
  offset?: number;
  limit?: number;
}): Promise<{
  items: Array<
    ListDetailItemRow & {
      displayImageUrl?: string | null;
      metadata: Record<string, unknown> | null;
      description: string | null;
    }
  >;
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  categorySlug: string | null;
} | null> {
  const safeOffset = Math.max(params.offset ?? 0, 0);
  const safeLimit = Math.min(
    Math.max(params.limit ?? LIST_DETAIL_ITEMS_PAGE_SIZE, 1),
    LIST_DETAIL_ITEMS_MAX_LIMIT
  );

  const list = await dbQuery(() =>
    prisma.lists.findFirst({
      where: {
        id: params.listId,
        ...publicCuratedListWhere,
      },
      select: {
        id: true,
        itemCount: true,
        categories: { select: { slug: true, isActive: true } },
        _count: { select: { items: true } },
      },
    })
  );

  if (!list) return null;
  if (list.categories && !list.categories.isActive) return null;

  const categorySlug = list.categories?.slug ?? null;
  const total = list.itemCount ?? list._count.items;

  const rows = await dbQuery(() =>
    prisma.items.findMany({
      where: { listId: params.listId, deletedAt: null },
      orderBy: { order: 'asc' },
      skip: safeOffset,
      take: safeLimit,
      select: listDetailItemSelect,
    })
  );

  const prepared = prepareListDetailForClient({
    items: withResolvedItemImages(
      rows.map((item) => ({
        ...item,
        metadata: item.metadata as Record<string, unknown> | null,
      })),
      categorySlug
    ),
  });

  return {
    items: prepared.items,
    categorySlug,
    pagination: {
      offset: safeOffset,
      limit: safeLimit,
      total,
      hasMore: safeOffset + rows.length < total,
    },
  };
}

/**
 * Paginated items for personal/user lists (/user-lists/[id]).
 * Enforces collaborator / public visibility before returning rows.
 */
export async function fetchUserListItemsPage(params: {
  listId: string;
  userId: string | null;
  offset?: number;
  limit?: number;
}): Promise<{
  items: Array<
    ListDetailItemRow & {
      displayImageUrl?: string | null;
      metadata: Record<string, unknown> | null;
      description: string | null;
    }
  >;
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  categorySlug: string | null;
} | null> {
  const safeOffset = Math.max(params.offset ?? 0, 0);
  const safeLimit = Math.min(
    Math.max(params.limit ?? LIST_DETAIL_ITEMS_PAGE_SIZE, 1),
    LIST_DETAIL_ITEMS_MAX_LIMIT
  );

  const list = await dbQuery(() =>
    prisma.lists.findUnique({
      where: { id: params.listId },
      select: {
        id: true,
        userId: true,
        isPublic: true,
        isActive: true,
        deletedAt: true,
        itemCount: true,
        categories: { select: { slug: true } },
        _count: { select: { items: true } },
      },
    })
  );

  if (!list || !list.isActive || list.deletedAt) return null;

  const access = await getListAccessForUser(list, params.userId);
  if (!list.isPublic && !access.canView) return null;

  const categorySlug = list.categories?.slug ?? null;
  const total = list.itemCount ?? list._count.items;

  const rows = await dbQuery(() =>
    prisma.items.findMany({
      where: { listId: params.listId, deletedAt: null },
      orderBy: { order: 'asc' },
      skip: safeOffset,
      take: safeLimit,
      select: listDetailItemSelect,
    })
  );

  const prepared = prepareListDetailForClient({
    items: withResolvedItemImages(
      rows.map((item) => ({
        ...item,
        metadata: item.metadata as Record<string, unknown> | null,
      })),
      categorySlug
    ),
  });

  return {
    items: prepared.items,
    categorySlug,
    pagination: {
      offset: safeOffset,
      limit: safeLimit,
      total,
      hasMore: safeOffset + rows.length < total,
    },
  };
}
