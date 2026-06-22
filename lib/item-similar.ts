import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';
import type { SimilarItem } from '@/types/items';

const CACHE_SECONDS = 900;

export async function getSimilarItemsForItem(
  currentItemId: string
): Promise<SimilarItem[] | null> {
  const currentItem = await dbQuery(() =>
    prisma.items.findUnique({
      where: { id: currentItemId },
      select: {
        id: true,
        listId: true,
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
  const currentTags = currentItem.lists?.tags ?? [];

  if (!categoryId) return [];

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

  const sharedTagCount = (tags: string[]) => {
    const set = new Set(currentTags.map((t) => t.toLowerCase()));
    return tags.filter((t) => set.has(t.toLowerCase())).length;
  };

  const sorted = [...candidates]
    .sort((a, b) => {
      const aShared = sharedTagCount(a.lists?.tags ?? []);
      const bShared = sharedTagCount(b.lists?.tags ?? []);
      if (bShared !== aShared) return bShared - aShared;
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, 8);

  return sorted.map((i) => ({
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

export function getCachedSimilarItems(itemId: string): Promise<SimilarItem[] | null> {
  return unstable_cache(
    () => getSimilarItemsForItem(itemId),
    [`similar-${itemId}`],
    { revalidate: CACHE_SECONDS, tags: [`similar-${itemId}`] }
  )();
}
