import { unstable_cache } from 'next/cache';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  CatalogNotReadyError,
  countMultiListCatalogItems,
  findDuplicateCatalogGroups,
  isCatalogClientReady,
} from '@/lib/catalog-items';
import { getSuggestionsStats } from '@/lib/admin/suggestions-stats';
import { resolveStoredItemTip } from '@/lib/admin/item-tip-import';
import { isGenericListCover } from '@/lib/image-url-policy';
import { needsS3MigrationImageUrl } from '@/lib/item-image-storage';
import { catalogMissingPosterImage } from '@/lib/missing-image-utils';
import { ADMIN_LISTS_CACHE_SECONDS, ADMIN_CACHE_TAGS } from '@/lib/admin/admin-cache';

export type ContentHubStats = {
  activeLists: number;
  catalogEntities: number;
  placements: number;
  multiListCatalog: number;
  duplicateCatalogGroups: number;
  lowEngagementLists: number;
  suggestionsPending: number;
  listsMissingCover: number;
  listsMissingDescription: number;
  catalogExternalImages: number;
  catalogMissingPosters: number;
  itemsMissingTip: number;
  insightLine: string;
};

function asMetaRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

async function countCatalogImageHealth(client: PrismaClient): Promise<{
  externalImages: number;
  missingPosters: number;
}> {
  const rows = await client.catalog_items.findMany({
    select: { imageUrl: true },
  });

  let externalImages = 0;
  let missingPosters = 0;
  for (const row of rows) {
    if (catalogMissingPosterImage(row.imageUrl)) {
      missingPosters += 1;
    } else if (needsS3MigrationImageUrl(row.imageUrl)) {
      externalImages += 1;
    }
  }

  return { externalImages, missingPosters };
}

async function countListsMissingCover(client: PrismaClient): Promise<number> {
  const rows = await client.lists.findMany({
    where: { deletedAt: null, isActive: true },
    select: { coverImage: true },
  });
  return rows.filter((row) => isGenericListCover(row.coverImage)).length;
}

async function countItemsMissingTip(client: PrismaClient): Promise<number> {
  const rows = await client.items.findMany({
    where: {
      deletedAt: null,
      lists: { deletedAt: null, isActive: true },
    },
    select: {
      metadata: true,
      catalog_items: { select: { metadata: true } },
    },
  });

  let missing = 0;
  for (const row of rows) {
    const tip = resolveStoredItemTip(
      asMetaRecord(row.metadata),
      asMetaRecord(row.catalog_items?.metadata)
    );
    if (!tip) missing += 1;
  }
  return missing;
}

export async function getContentHubStats(): Promise<ContentHubStats> {
  const catalogReady = isCatalogClientReady(prisma);

  const [
    activeLists,
    placements,
    suggestions,
    lowEngagementLists,
    catalogEntities,
    multiListCatalog,
    duplicateGroups,
    listsMissingCover,
    listsMissingDescription,
    itemsMissingTip,
    catalogImageHealth,
  ] = await dbQuery(() =>
    Promise.all([
      prisma.lists.count({ where: { deletedAt: null, isActive: true } }),
      prisma.items.count({
        where: { lists: { deletedAt: null, isActive: true } },
      }),
      getSuggestionsStats(),
      prisma.lists.count({
        where: {
          deletedAt: null,
          isActive: true,
          saveCount: { lte: 5 },
          itemCount: { gt: 0 },
        },
      }),
      catalogReady ? prisma.catalog_items.count() : Promise.resolve(0),
      catalogReady ? countMultiListCatalogItems(prisma) : Promise.resolve(0),
      catalogReady
        ? findDuplicateCatalogGroups(prisma, { limit: 100 })
        : Promise.resolve([]),
      countListsMissingCover(prisma),
      prisma.lists.count({
        where: {
          deletedAt: null,
          isActive: true,
          OR: [{ description: null }, { description: '' }],
        },
      }),
      countItemsMissingTip(prisma),
      catalogReady
        ? countCatalogImageHealth(prisma)
        : Promise.resolve({ externalImages: 0, missingPosters: 0 }),
    ])
  );

  const dupCount = duplicateGroups.length;
  const { externalImages: catalogExternalImages, missingPosters: catalogMissingPosters } =
    catalogImageHealth;

  const healthIssues: { label: string; count: number }[] = [
    { label: 'تصویر خارجی استوریج', count: catalogExternalImages },
    { label: 'tip خالی', count: itemsMissingTip },
    { label: 'توضیح لیست خالی', count: listsMissingDescription },
    { label: 'لیست بدون کاور', count: listsMissingCover },
    { label: 'کاتالوگ بدون تصویر', count: catalogMissingPosters },
    { label: 'تکراری کاتالوگ', count: dupCount },
    { label: 'پیشنهاد در انتظار', count: suggestions.totalPending },
  ].filter((item) => item.count > 0);

  const parts = healthIssues.map(
    (item) => `${item.count.toLocaleString('fa-IR')} ${item.label}`
  );

  return {
    activeLists,
    catalogEntities,
    placements,
    multiListCatalog,
    duplicateCatalogGroups: dupCount,
    lowEngagementLists,
    suggestionsPending: suggestions.totalPending,
    listsMissingCover,
    listsMissingDescription,
    catalogExternalImages,
    catalogMissingPosters,
    itemsMissingTip,
    insightLine:
      parts.length > 0 ? parts.join(' · ') : 'هیچ مورد بحرانی در صف کار نیست',
  };
}

/**
 * نسخهٔ کش‌شده — getContentHubStats روی هر لود صفحهٔ لیست‌ها ~۷ کوئری (شامل
 * count کل‌جدولِ catalog_items و اسکن گروه‌های تکراری) می‌زد و کشِ دادهٔ لیست‌ها
 * را خنثی می‌کرد. با tag `admin-lists` پس از mutation ابطال می‌شود.
 */
export const getCachedContentHubStats = unstable_cache(
  getContentHubStats,
  ['admin-content-hub-stats'],
  { revalidate: ADMIN_LISTS_CACHE_SECONDS, tags: [ADMIN_CACHE_TAGS.lists] }
);

export { CatalogNotReadyError };
