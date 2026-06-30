import type { PrismaClient } from '@prisma/client';
import { getItemEffectiveImageUrl } from '@/lib/item-image-storage';
import {
  catalogMissingPosterImage,
  extractItemImdbId,
} from '@/lib/missing-image-utils';

export type ItemMissingImageRow = {
  id: string;
  title: string;
  order: number;
  listId: string;
  listTitle: string;
  imdbId: string | null;
  catalogItemId: string | null;
  isHidden: boolean;
};

type ItemRow = {
  id: string;
  title: string;
  order: number;
  imageUrl: string | null;
  metadata: unknown;
  externalUrl: string | null;
  catalogItemId: string | null;
  catalog_items: {
    id: string;
    imageUrl: string | null;
    metadata: unknown;
    externalUrl: string | null;
    externalKey: string | null;
  } | null;
  lists: { id: string; title: string };
  item_moderation: { status: string } | null;
};

function mapMissingImageItem(row: ItemRow): ItemMissingImageRow | null {
  const effectiveUrl = getItemEffectiveImageUrl({
    imageUrl: row.imageUrl,
    catalogImageUrl: row.catalog_items?.imageUrl,
  });

  if (!catalogMissingPosterImage(effectiveUrl)) return null;

  return {
    id: row.id,
    title: row.title,
    order: row.order,
    listId: row.lists.id,
    listTitle: row.lists.title,
    imdbId: extractItemImdbId({
      metadata: row.metadata,
      externalUrl: row.externalUrl,
      catalog: row.catalog_items,
    }),
    catalogItemId: row.catalogItemId,
    isHidden: row.item_moderation?.status === 'HIDDEN',
  };
}

const itemSelect = {
  id: true,
  title: true,
  order: true,
  imageUrl: true,
  metadata: true,
  externalUrl: true,
  catalogItemId: true,
  catalog_items: {
    select: {
      id: true,
      imageUrl: true,
      metadata: true,
      externalUrl: true,
      externalKey: true,
    },
  },
  lists: { select: { id: true, title: true } },
  item_moderation: { select: { status: true } },
} as const;

export async function listItemsMissingImageItems(
  prisma: PrismaClient,
  scope: { listId?: string; categoryId?: string }
): Promise<ItemMissingImageRow[]> {
  const where = scope.listId
    ? { listId: scope.listId }
    : { lists: { categoryId: scope.categoryId! } };

  const rows = await prisma.items.findMany({
    where,
    orderBy: scope.listId
      ? { order: 'asc' }
      : [{ lists: { title: 'asc' } }, { order: 'asc' }],
    select: itemSelect,
  });

  return rows
    .map((row) => mapMissingImageItem(row as ItemRow))
    .filter((row): row is ItemMissingImageRow => row !== null);
}
