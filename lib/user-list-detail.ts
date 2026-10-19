import 'server-only';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { prepareListDetailForClient } from '@/lib/list-detail-serialize';
import { withResolvedItemImages } from '@/lib/resolve-item-image';
import { USER_LIST_DETAIL_SSR_ITEM_LIMIT } from '@/lib/list-detail-items-shared';
import { listDetailItemSelect } from '@/lib/list-detail-items';

/**
 * Personal list detail loader — React.cache dedupes generateMetadata + page.
 * First-paint items only; remainder via GET /api/user/lists/[id]/items.
 */
export const getUserListById = cache(async (id: string) => {
  return dbQuery(() =>
    prisma.lists.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        isPublic: true,
        isActive: true,
        deletedAt: true,
        viewCount: true,
        likeCount: true,
        saveCount: true,
        itemCount: true,
        commentsEnabled: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        categoryId: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
          },
        },
        items: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          take: USER_LIST_DETAIL_SSR_ITEM_LIMIT,
          select: listDetailItemSelect,
        },
        users: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        _count: {
          select: {
            items: true,
            list_likes: true,
          },
        },
      },
    })
  );
});

export function prepareUserListForClient<
  T extends {
    items: Array<{
      id: string;
      title: string;
      description?: string | null;
      metadata?: unknown;
      imageUrl?: string | null;
    }>;
    categories?: { slug?: string | null } | null;
  },
>(list: T) {
  const categorySlug = list.categories?.slug ?? null;
  return prepareListDetailForClient({
    ...list,
    items: withResolvedItemImages(
      list.items.map((item) => ({
        ...item,
        metadata: item.metadata as Record<string, unknown> | null,
      })),
      categorySlug
    ),
  });
}
