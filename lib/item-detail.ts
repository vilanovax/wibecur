import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';
import {
  slimItemDetailMetadata,
  trimItemDescription,
} from '@/lib/item-detail-serialize';
import {
  isLightweightListItem,
  sourceCategorySlugFromItem,
} from '@/lib/list-entry';
import { itemDetailCacheTag } from '@/lib/public-cache';
import type { ItemDetailClientSeed } from '@/lib/item-detail-types';

export type { ItemDetailClientSeed } from '@/lib/item-detail-types';

export const itemDetailSelect = {
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
  listId: true,
  order: true,
  createdAt: true,
  deletedAt: true,
  _count: {
    select: { comments: true },
  },
  item_moderation: { select: { status: true } },
  lists: {
    select: {
      id: true,
      title: true,
      slug: true,
      saveCount: true,
      categoryId: true,
      tags: true,
      categories: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
        },
      },
    },
  },
} as const;

export type ItemDetailRow = NonNullable<
  Awaited<ReturnType<typeof loadItemById>>
>;

function loadItemById(id: string) {
  return prisma.items.findUnique({
    where: { id },
    select: itemDetailSelect,
  });
}

/**
 * واکشی آیتم:
 * - `unstable_cache`: کش بین‌درخواستی با tag `item-{id}`
 * - `cache()` React: dedupe داخل یک request (generateMetadata + بدنه)
 */
export const getItemById = cache((id: string) =>
  unstable_cache(() => loadItemById(id), ['item-by-id-v2', id], {
    revalidate: 60,
    tags: [itemDetailCacheTag(id)],
  })()
);

export type SerializedItemDetail = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  displayImageUrl: string;
  externalUrl: string | null;
  catalogItemId: string | null;
  listNote: string | null;
  rating: number | null;
  voteCount: number | null;
  metadata: Record<string, unknown> | null;
  commentCount: number;
  lists: {
    id: string;
    title: string;
    slug: string;
    saveCount: number;
    categoryId: string | null;
    tags: string[];
    categories: {
      id: string;
      name: string;
      slug: string;
      icon: string;
      color: string;
    } | null;
  };
};

/** Payload کامل برای RSC (hero + metadata) — metadata از قبل slim شده */
export function serializeItemDetail(item: ItemDetailRow): SerializedItemDetail {
  const rawMeta =
    item.metadata != null &&
    typeof item.metadata === 'object' &&
    !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : null;
  const metadata = slimItemDetailMetadata(rawMeta);
  const categorySlug = item.lists.categories?.slug ?? null;

  return {
    id: item.id,
    title: item.title,
    description: trimItemDescription(item.description),
    imageUrl: item.imageUrl,
    displayImageUrl: resolveItemDisplayImage({
      id: item.id,
      imageUrl: item.imageUrl,
      title: item.title,
      metadata,
      categorySlug,
    }),
    externalUrl: item.externalUrl,
    catalogItemId: item.catalogItemId,
    listNote: item.listNote?.trim() || null,
    rating: item.rating,
    voteCount: item.voteCount,
    metadata,
    commentCount: item._count.comments,
    lists: {
      id: item.lists.id,
      title: item.lists.title,
      slug: item.lists.slug,
      saveCount: item.lists.saveCount ?? 0,
      categoryId: item.lists.categoryId,
      tags: item.lists.tags ?? [],
      categories: item.lists.categories,
    },
  };
}

/** Seed سبک برای کلاینت — بدون description/metadata کامل */
export function toItemDetailClientSeed(
  item: SerializedItemDetail
): ItemDetailClientSeed {
  const listCategorySlug = item.lists.categories?.slug ?? null;
  const itemCategorySlug =
    sourceCategorySlugFromItem({
      metadata: item.metadata,
      catalogItemId: item.catalogItemId,
    }) ?? listCategorySlug;
  const isLightweight = isLightweightListItem({
    catalogItemId: item.catalogItemId,
    metadata: item.metadata,
    imageUrl: item.imageUrl,
    externalUrl: item.externalUrl,
  });

  return {
    id: item.id,
    title: item.title,
    catalogItemId: item.catalogItemId,
    voteCount: item.voteCount,
    itemCategorySlug,
    isLightweight,
    lists: {
      id: item.lists.id,
      title: item.lists.title,
      slug: item.lists.slug,
      saveCount: item.lists.saveCount,
      categories: item.lists.categories
        ? {
            id: item.lists.categories.id,
            name: item.lists.categories.name,
            slug: item.lists.categories.slug,
            icon: item.lists.categories.icon,
            color: item.lists.categories.color,
          }
        : null,
    },
  };
}
