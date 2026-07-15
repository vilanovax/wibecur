import type { Prisma, PrismaClient } from '@prisma/client';
import { isCatalogAdminDisabled } from '@/lib/admin/catalog-visibility';
import { catalogCategoryLabel } from '@/lib/catalog-display';
import { expandCategorySlugFilter } from '@/lib/category-slug-aliases';
import { buildCafePhotoSearchQuery, extractCafeCoverMetadata, isCafeCategorySlug } from '@/lib/cafe-cover-search';
import { catalogMissingPosterImage, extractCatalogImdbId } from '@/lib/missing-image-utils';
import { externalImageHost, needsS3MigrationImageUrl } from '@/lib/item-image-storage';

function catalogCategoryWhere(categorySlug?: string): Prisma.catalog_itemsWhereInput | undefined {
  if (!categorySlug) return undefined;
  if (categorySlug === '__none__') return { categorySlug: null };
  const slugs = expandCategorySlugFilter(categorySlug);
  if (slugs.length === 0) return undefined;
  if (slugs.length === 1) return { categorySlug: slugs[0] };
  return { categorySlug: { in: slugs } };
}

export type StorageImageRepairStatus = 'missing' | 'external';

export type StorageImageRepairRow = {
  id: string;
  title: string;
  categorySlug: string | null;
  categoryLabel: string;
  imageUrl: string;
  status: StorageImageRepairStatus;
  host: string;
  listCount: number;
  imdbId: string | null;
  isHidden: boolean;
  metadata: Record<string, unknown> | null;
};

export type StorageImageRepairFilters = {
  categorySlug?: string;
  status?: 'all' | StorageImageRepairStatus;
  q?: string;
};

export function buildCatalogRepairSearchQuery(input: {
  title: string;
  categorySlug?: string | null;
  metadata?: unknown;
}): string {
  const title = input.title.trim();
  const slug = input.categorySlug?.trim() || '';

  if (isCafeCategorySlug(slug)) {
    return buildCafePhotoSearchQuery(title, extractCafeCoverMetadata(input.metadata));
  }

  const categoryHint = catalogCategoryLabel(slug);
  const parts: string[] = [];
  if (title) parts.push(`"${title}"`);

  if (/book|literature|podcast/i.test(slug)) {
    parts.push('کتاب', 'جلد');
  } else if (/movie|film/i.test(slug)) {
    parts.push('پوستر', 'poster');
  } else if (categoryHint && categoryHint !== slug) {
    parts.push(categoryHint);
  }

  return parts.join(' ').slice(0, 120);
}

export async function listStorageImageRepairItems(
  prisma: PrismaClient,
  filters: StorageImageRepairFilters = {}
): Promise<StorageImageRepairRow[]> {
  const where = {
    ...(catalogCategoryWhere(filters.categorySlug) ?? {}),
  };

  const rows = await prisma.catalog_items.findMany({
    where,
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      categorySlug: true,
      metadata: true,
      externalUrl: true,
      externalKey: true,
      _count: { select: { items: true } },
    },
  });

  const q = filters.q?.trim().toLowerCase() || '';
  const statusFilter = filters.status ?? 'all';

  return rows
    .map((row) => {
      const imageUrl = row.imageUrl?.trim() || '';
      const isMissing = catalogMissingPosterImage(imageUrl);
      const isExternal = !isMissing && needsS3MigrationImageUrl(imageUrl);
      if (!isMissing && !isExternal) return null;

      const status: StorageImageRepairStatus = isMissing ? 'missing' : 'external';
      if (statusFilter !== 'all' && statusFilter !== status) return null;

      if (q) {
        const haystack = [
          row.title,
          row.categorySlug,
          catalogCategoryLabel(row.categorySlug),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return null;
      }

      const metadata =
        row.metadata != null && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : null;

      return {
        id: row.id,
        title: row.title,
        categorySlug: row.categorySlug,
        categoryLabel: catalogCategoryLabel(row.categorySlug),
        imageUrl,
        status,
        host: imageUrl ? externalImageHost(imageUrl) : '—',
        listCount: row._count.items,
        imdbId: extractCatalogImdbId({
          metadata: row.metadata,
          externalUrl: row.externalUrl,
          externalKey: row.externalKey,
        }),
        isHidden: isCatalogAdminDisabled(row.metadata),
        metadata,
      } satisfies StorageImageRepairRow;
    })
    .filter((row): row is StorageImageRepairRow => row !== null);
}
