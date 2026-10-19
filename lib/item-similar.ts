import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';
import type { SimilarItem } from '@/types/items';

const CACHE_SECONDS = 900;

async function loadSimilarByCategory(
  currentItemId: string,
  categoryId: string,
  currentTags: string[]
): Promise<SimilarItem[]> {
  const candidates = await dbQuery(() =>
    prisma.items.findMany({
      where: {
        id: { not: currentItemId },
        lists: {
          categoryId,
          isActive: true,
        },
        OR: [
          { item_moderation: null },
          { item_moderation: { status: { notIn: ['HIDDEN', 'UNDER_REVIEW'] } } },
        ],
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        rating: true,
        lists: {
          select: {
            tags: true,
            categories: {
              select: {
                name: true,
                icon: true,
                slug: true,
              },
            },
          },
        },
      },
      take: 24,
    })
  );

  const tagSet = new Set(currentTags.map((t) => t.toLowerCase()));
  const sharedTagCount = (tags: string[]) =>
    tags.filter((t) => tagSet.has(t.toLowerCase())).length;

  return [...candidates]
    .sort((a, b) => {
      const aShared = sharedTagCount(a.lists?.tags ?? []);
      const bShared = sharedTagCount(b.lists?.tags ?? []);
      if (bShared !== aShared) return bShared - aShared;
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, 8)
    .map((i) => ({
      id: i.id,
      title: i.title,
      image: resolveItemDisplayImage({
        id: i.id,
        imageUrl: i.imageUrl,
        title: i.title,
        categorySlug: i.lists?.categories?.slug ?? null,
      }),
      rating: i.rating,
      category: i.lists?.categories
        ? {
            name: i.lists.categories.name,
            icon: i.lists.categories.icon ?? null,
          }
        : null,
    }));
}

/** API / cache path — looks up category from DB */
export async function getSimilarItemsForItem(
  currentItemId: string
): Promise<SimilarItem[] | null> {
  const currentItem = await dbQuery(() =>
    prisma.items.findUnique({
      where: { id: currentItemId },
      select: {
        id: true,
        lists: {
          select: {
            categoryId: true,
            tags: true,
          },
        },
      },
    })
  );

  if (!currentItem) return null;

  const categoryId = currentItem.lists?.categoryId ?? null;
  if (!categoryId) return [];

  return loadSimilarByCategory(
    currentItemId,
    categoryId,
    currentItem.lists?.tags ?? []
  );
}

/**
 * Page path — skip re-fetching the current item when category/tags
 * are already available from the item detail query (async-parallel / no waterfall).
 */
export function getCachedSimilarItemsWithContext(
  itemId: string,
  categoryId: string | null,
  tags: string[]
): Promise<SimilarItem[]> {
  if (!categoryId) return Promise.resolve([]);

  const tagsKey = [...tags].map((t) => t.toLowerCase()).sort().join('|');
  return unstable_cache(
    () => loadSimilarByCategory(itemId, categoryId, tags),
    ['similar-v2', itemId, categoryId, tagsKey],
    { revalidate: CACHE_SECONDS, tags: [`similar-${itemId}`] }
  )();
}

export function getCachedSimilarItems(itemId: string): Promise<SimilarItem[] | null> {
  return unstable_cache(
    () => getSimilarItemsForItem(itemId),
    [`similar-${itemId}`],
    { revalidate: CACHE_SECONDS, tags: [`similar-${itemId}`] }
  )();
}
