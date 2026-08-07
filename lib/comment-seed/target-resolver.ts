import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { activeCategoryWhere } from '@/lib/public-content-filters';
import type { CommentSeedTargetType, SeedItemContext } from './types';

export async function resolveSeedTargetItems(
  targetType: CommentSeedTargetType,
  targetIds: string[]
): Promise<SeedItemContext[]> {
  const uniqueIds = [...new Set(targetIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  if (targetType === 'item') {
    return fetchItemsByIds(uniqueIds);
  }

  if (targetType === 'list') {
    const items = await dbQuery(() =>
      prisma.items.findMany({
        where: {
          listId: { in: uniqueIds },
          deletedAt: null,
          lists: {
            deletedAt: null,
            isActive: true,
            OR: [
              { categoryId: null },
              { categories: { isActive: true, deletedAt: null } },
            ],
          },
        },
        select: itemSelect,
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
    );
    return items.map(mapItemRow);
  }

  const categories = await dbQuery(() =>
    prisma.categories.findMany({
      where: { ...activeCategoryWhere, id: { in: uniqueIds } },
      select: { id: true },
    })
  );
  const categoryIds = categories.map((c) => c.id);
  if (categoryIds.length === 0) return [];

  const items = await dbQuery(() =>
    prisma.items.findMany({
      where: {
        deletedAt: null,
        lists: {
          categoryId: { in: categoryIds },
          deletedAt: null,
          isActive: true,
        },
      },
      select: itemSelect,
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
  );
  return items.map(mapItemRow);
}

const itemSelect = {
  id: true,
  title: true,
  description: true,
  lists: {
    select: {
      title: true,
      categories: { select: { name: true, slug: true } },
    },
  },
} as const;

type ItemRow = {
  id: string;
  title: string;
  description: string | null;
  lists: {
    title: string;
    categories: { name: string; slug: string | null } | null;
  };
};

function mapItemRow(row: ItemRow): SeedItemContext {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    listTitle: row.lists?.title ?? null,
    categoryName: row.lists?.categories?.name ?? null,
    categorySlug: row.lists?.categories?.slug ?? null,
  };
}

async function fetchItemsByIds(ids: string[]): Promise<SeedItemContext[]> {
  const items = await dbQuery(() =>
    prisma.items.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      select: itemSelect,
    })
  );
  return items.map(mapItemRow);
}

export async function countSeedTargetItems(
  targetType: CommentSeedTargetType,
  targetIds: string[]
): Promise<number> {
  const items = await resolveSeedTargetItems(targetType, targetIds);
  return items.length;
}
