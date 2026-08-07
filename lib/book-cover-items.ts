import type { PrismaClient } from '@prisma/client';
import { isBookCategorySlug } from '@/lib/book-cover-search';
import { isPlaceholderCoverPath } from '@/lib/image-url-policy';
import { getItemEffectiveImageUrl, hasParsPackInUrl } from '@/lib/item-image-storage';
import { detectBookUrl } from '@/lib/books/url-detect';
import type { BookSource } from '@/lib/books/types';

export type BookCoverItemRow = {
  id: string;
  title: string;
  order: number;
  listId: string;
  listTitle: string;
  imageUrl: string;
  status: 'missing' | 'external';
  detectedSource: BookSource | null;
  catalogItemId: string | null;
  isHidden: boolean;
};

/** آیا تصویر آیتم کتاب هنوز روی ParsPack نیست؟ */
export function needsBookCoverOnParsPack(url: string | null | undefined): boolean {
  const t = url?.trim() || '';
  if (!t || isPlaceholderCoverPath(t)) return true;
  return !hasParsPackInUrl(t);
}

function detectSourceFromExternalUrl(externalUrl: string | null | undefined): BookSource | null {
  if (!externalUrl?.trim()) return null;
  const detected = detectBookUrl(externalUrl.trim());
  return detected?.source ?? null;
}

type ItemRow = {
  id: string;
  title: string;
  order: number;
  imageUrl: string | null;
  externalUrl: string | null;
  catalogItemId: string | null;
  catalog_items: { imageUrl: string | null; externalUrl: string | null } | null;
  item_moderation: { status: string } | null;
  lists: { id: string; title: string; categories: { slug: string } | null };
};

function mapBookCoverItem(row: ItemRow): BookCoverItemRow | null {
  const categorySlug = row.lists.categories?.slug;
  if (!isBookCategorySlug(categorySlug)) return null;

  const effectiveUrl = getItemEffectiveImageUrl({
    imageUrl: row.imageUrl,
    catalogImageUrl: row.catalog_items?.imageUrl,
  });

  if (!needsBookCoverOnParsPack(effectiveUrl)) return null;

  const externalUrl = row.externalUrl?.trim() || row.catalog_items?.externalUrl?.trim() || null;

  return {
    id: row.id,
    title: row.title,
    order: row.order,
    listId: row.lists.id,
    listTitle: row.lists.title,
    imageUrl: effectiveUrl,
    status: !effectiveUrl || isPlaceholderCoverPath(effectiveUrl) ? 'missing' : 'external',
    detectedSource: detectSourceFromExternalUrl(externalUrl),
    catalogItemId: row.catalogItemId,
    isHidden: row.item_moderation?.status === 'HIDDEN',
  };
}

const itemSelect = {
  id: true,
  title: true,
  order: true,
  imageUrl: true,
  externalUrl: true,
  catalogItemId: true,
  item_moderation: { select: { status: true } },
  catalog_items: { select: { imageUrl: true, externalUrl: true } },
  lists: {
    select: {
      id: true,
      title: true,
      categories: { select: { slug: true } },
    },
  },
} as const;

export async function listBookCoverItems(
  prisma: PrismaClient,
  scope: { listId?: string; categoryId?: string }
): Promise<BookCoverItemRow[]> {
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
    .map((row) => mapBookCoverItem(row as ItemRow))
    .filter((row): row is BookCoverItemRow => row !== null);
}
