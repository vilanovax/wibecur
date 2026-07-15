import type { PrismaClient } from '@prisma/client';
import {
  extractCafeCoverMetadata,
  isCafeCategorySlug,
  type CafeCoverMetadata,
} from '@/lib/cafe-cover-search';
import { isPlaceholderCoverPath } from '@/lib/image-url-policy';
import { getItemEffectiveImageUrl, hasParsPackInUrl } from '@/lib/item-image-storage';

export type CafeCoverItemRow = {
  id: string;
  title: string;
  order: number;
  listId: string;
  listTitle: string;
  imageUrl: string;
  status: 'missing' | 'external';
  metadata: CafeCoverMetadata;
  catalogItemId: string | null;
  isHidden: boolean;
};

export function needsCafeCoverOnParsPack(url: string | null | undefined): boolean {
  const t = url?.trim() || '';
  if (!t || isPlaceholderCoverPath(t)) return true;
  return !hasParsPackInUrl(t);
}

type ItemRow = {
  id: string;
  title: string;
  order: number;
  imageUrl: string | null;
  metadata: unknown;
  catalogItemId: string | null;
  catalog_items: { imageUrl: string | null; metadata: unknown } | null;
  item_moderation: { status: string } | null;
  lists: { id: string; title: string; categories: { slug: string } | null };
};

function mapCafeCoverItem(row: ItemRow): CafeCoverItemRow | null {
  const categorySlug = row.lists.categories?.slug;
  if (!isCafeCategorySlug(categorySlug)) return null;

  const effectiveUrl = getItemEffectiveImageUrl({
    imageUrl: row.imageUrl,
    catalogImageUrl: row.catalog_items?.imageUrl,
  });

  if (!needsCafeCoverOnParsPack(effectiveUrl)) return null;

  const itemMeta = extractCafeCoverMetadata(row.metadata);
  const catalogMeta = extractCafeCoverMetadata(row.catalog_items?.metadata);
  const metadata: CafeCoverMetadata = {
    address: itemMeta.address || catalogMeta.address,
    instagram: itemMeta.instagram || catalogMeta.instagram,
    website: itemMeta.website || catalogMeta.website,
    mapsUrl: itemMeta.mapsUrl || catalogMeta.mapsUrl,
    cuisine: itemMeta.cuisine || catalogMeta.cuisine,
  };

  return {
    id: row.id,
    title: row.title,
    order: row.order,
    listId: row.lists.id,
    listTitle: row.lists.title,
    imageUrl: effectiveUrl,
    status: !effectiveUrl || isPlaceholderCoverPath(effectiveUrl) ? 'missing' : 'external',
    metadata,
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
  catalogItemId: true,
  item_moderation: { select: { status: true } },
  catalog_items: { select: { imageUrl: true, metadata: true } },
  lists: {
    select: {
      id: true,
      title: true,
      categories: { select: { slug: true } },
    },
  },
} as const;

export async function listCafeCoverItems(
  prisma: PrismaClient,
  scope: { listId?: string; categoryId?: string }
): Promise<CafeCoverItemRow[]> {
  const where = scope.listId
    ? { listId: scope.listId, deletedAt: null }
    : { lists: { categoryId: scope.categoryId! }, deletedAt: null };

  const rows = await prisma.items.findMany({
    where,
    orderBy: scope.listId
      ? { order: 'asc' }
      : [{ lists: { title: 'asc' } }, { order: 'asc' }],
    select: itemSelect,
  });

  return rows
    .map((row) => mapCafeCoverItem(row as ItemRow))
    .filter((row): row is CafeCoverItemRow => row !== null);
}
