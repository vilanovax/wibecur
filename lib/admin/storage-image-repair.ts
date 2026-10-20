import { Prisma, type PrismaClient } from '@prisma/client';
import { catalogCategoryLabel } from '@/lib/catalog-display';
import { expandCategorySlugFilter } from '@/lib/category-slug-aliases';
import { buildCafePhotoSearchQuery, extractCafeCoverMetadata, isCafeCategorySlug } from '@/lib/cafe-cover-search';
import { catalogMissingPosterImage } from '@/lib/missing-image-utils';
import { externalImageHost, needsS3MigrationImageUrl } from '@/lib/item-image-storage';

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
  instagram: string | null;
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

type RepairCandidateSql = {
  id: string;
  title: string;
  imageUrl: string | null;
  categorySlug: string | null;
  instagram: string | null;
  listCount: number;
};

function categorySql(categorySlug?: string): Prisma.Sql {
  if (!categorySlug || categorySlug === 'all') return Prisma.sql`TRUE`;
  if (categorySlug === '__none__') return Prisma.sql`c."categorySlug" IS NULL`;
  const slugs = expandCategorySlugFilter(categorySlug);
  if (slugs.length === 0) return Prisma.sql`TRUE`;
  return Prisma.sql`c."categorySlug" IN (${Prisma.join(slugs)})`;
}

/** فقط ردیف‌هایی که ممکن است بدون تصویر یا خارج از ParsPack باشند — بدون کل metadata. */
export async function listStorageImageRepairItems(
  prisma: PrismaClient,
  filters: StorageImageRepairFilters = {}
): Promise<StorageImageRepairRow[]> {
  const rows = await prisma.$queryRaw<RepairCandidateSql[]>(Prisma.sql`
    SELECT
      c.id,
      c.title,
      c."imageUrl",
      c."categorySlug",
      NULLIF(btrim(c.metadata->>'instagram'), '') AS instagram,
      COALESCE(p.n, 0)::int AS "listCount"
    FROM catalog_items c
    LEFT JOIN (
      SELECT i."catalogItemId" AS id, COUNT(*)::int AS n
      FROM items i
      WHERE i."deletedAt" IS NULL AND i."catalogItemId" IS NOT NULL
      GROUP BY i."catalogItemId"
    ) p ON p.id = c.id
    WHERE ${categorySql(filters.categorySlug)}
      AND (
        c."imageUrl" IS NULL
        OR btrim(COALESCE(c."imageUrl", '')) = ''
        OR c."imageUrl" ILIKE '%placeholder-cover%'
        OR c."imageUrl" ILIKE '%placeholder-item%'
        OR c."imageUrl" NOT ILIKE '%parspack.net%'
      )
    ORDER BY c.title ASC
  `);

  const q = filters.q?.trim().toLowerCase() || '';
  const statusFilter = filters.status ?? 'all';
  const items: StorageImageRepairRow[] = [];

  for (const row of rows) {
    const imageUrl = row.imageUrl?.trim() || '';
    const isMissing = catalogMissingPosterImage(imageUrl);
    const isExternal = !isMissing && needsS3MigrationImageUrl(imageUrl);
    if (!isMissing && !isExternal) continue;

    const status: StorageImageRepairStatus = isMissing ? 'missing' : 'external';
    if (statusFilter !== 'all' && statusFilter !== status) continue;

    const categoryLabel = catalogCategoryLabel(row.categorySlug);
    if (q) {
      const haystack = [row.title, row.categorySlug, categoryLabel, imageUrl, row.instagram]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) continue;
    }

    items.push({
      id: row.id,
      title: row.title,
      categorySlug: row.categorySlug,
      categoryLabel,
      imageUrl,
      status,
      host: imageUrl ? externalImageHost(imageUrl) : '—',
      listCount: row.listCount,
      imdbId: null,
      isHidden: false,
      instagram: row.instagram,
      metadata: null,
    });
  }

  return items;
}
