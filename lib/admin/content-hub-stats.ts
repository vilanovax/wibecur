/**
 * Content hub KPI strip stats for /admin/lists.
 *
 * Perf: replace full-table JS scans (catalog/items/covers) with SQL aggregates.
 * Previous path loaded up to 8k catalog rows + all item metadata into Node.
 */

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { Prisma, type PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  CatalogNotReadyError,
  isCatalogClientReady,
} from '@/lib/catalog-items';
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

async function countSuggestionsPending(client: PrismaClient): Promise<number> {
  const [listPending, itemPending, menuPending] = await Promise.all([
    client.suggested_lists.count({ where: { status: 'pending' } }),
    client.suggested_items.count({ where: { status: 'pending' } }),
    client.list_comments.count({
      where: {
        type: 'suggestion',
        deletedAt: null,
        suggestionStatus: 'pending',
      },
    }),
  ]);
  return listPending + itemPending + menuPending;
}

/** Approximate isGenericListCover via SQL predicates (hub badge only). */
async function countListsMissingCoverSql(
  client: PrismaClient
): Promise<number> {
  const rows = await client.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM lists
    WHERE "deletedAt" IS NULL
      AND "isActive" = true
      AND (
        "coverImage" IS NULL
        OR btrim("coverImage") = ''
        OR "coverImage" ILIKE '%placeholder-cover%'
        OR "coverImage" ILIKE '%upload.wikimedia.org/wikipedia/commons/%'
        OR (
          "coverImage" ILIKE '%parspack%'
          AND "coverImage" ILIKE '%/covers/%'
        )
        OR "coverImage" ~* '/images/banners/(movies|books|cafe|restaurant|default)\\.webp$'
      )
  `);
  return rows[0]?.count ?? 0;
}

async function countCatalogImageHealthSql(
  client: PrismaClient
): Promise<{ externalImages: number; missingPosters: number }> {
  const rows = await client.$queryRaw<
    { missing: number; external: number }[]
  >(Prisma.sql`
    SELECT
      COUNT(*) FILTER (
        WHERE "imageUrl" IS NULL
          OR btrim("imageUrl") = ''
          OR "imageUrl" ILIKE '%placeholder-cover%'
          OR "imageUrl" ILIKE '%placeholder-item%'
      )::int AS missing,
      COUNT(*) FILTER (
        WHERE "imageUrl" IS NOT NULL
          AND btrim("imageUrl") <> ''
          AND "imageUrl" NOT ILIKE '%placeholder-cover%'
          AND "imageUrl" NOT ILIKE '%placeholder-item%'
          AND "imageUrl" NOT ILIKE '%parspack%'
          AND (
            "imageUrl" ~* 'banners?'
            OR "imageUrl" ~* '^https?://'
            OR "imageUrl" LIKE '//%'
            OR "imageUrl" LIKE '/%'
          )
      )::int AS external
    FROM catalog_items
  `);
  return {
    missingPosters: rows[0]?.missing ?? 0,
    externalImages: rows[0]?.external ?? 0,
  };
}

/** Tip key in metadata JSON — matches ITEM_TIP_METADATA_KEY = 'tip' */
async function countItemsMissingTipSql(client: PrismaClient): Promise<number> {
  const rows = await client.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM items i
    INNER JOIN lists l ON i."listId" = l.id
    LEFT JOIN catalog_items c ON i."catalogItemId" = c.id
    WHERE i."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND l."isActive" = true
      AND (
        i.metadata IS NULL
        OR NOT (i.metadata ? 'tip')
        OR NULLIF(btrim(i.metadata->>'tip'), '') IS NULL
      )
      AND (
        c.id IS NULL
        OR c.metadata IS NULL
        OR NOT (c.metadata ? 'tip')
        OR NULLIF(btrim(c.metadata->>'tip'), '') IS NULL
      )
  `);
  return rows[0]?.count ?? 0;
}

async function countMultiListCatalogSql(client: PrismaClient): Promise<number> {
  const rows = await client.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT i."catalogItemId"
      FROM items i
      WHERE i."catalogItemId" IS NOT NULL
        AND i."deletedAt" IS NULL
      GROUP BY i."catalogItemId"
      HAVING COUNT(*) > 1
    ) t
  `);
  return rows[0]?.count ?? 0;
}

/** Approximate duplicate groups by categorySlug + lower(trim(title)) */
async function countDuplicateCatalogGroupsSql(
  client: PrismaClient
): Promise<number> {
  const rows = await client.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT 1
      FROM catalog_items
      GROUP BY "categorySlug", lower(btrim(title))
      HAVING COUNT(*) >= 2
    ) t
  `);
  return rows[0]?.count ?? 0;
}

export async function getContentHubStats(): Promise<ContentHubStats> {
  const catalogReady = isCatalogClientReady(prisma);

  const [
    activeLists,
    placements,
    suggestionsPending,
    lowEngagementLists,
    catalogEntities,
    multiListCatalog,
    duplicateCatalogGroups,
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
      countSuggestionsPending(prisma),
      prisma.lists.count({
        where: {
          deletedAt: null,
          isActive: true,
          saveCount: { lte: 5 },
          itemCount: { gt: 0 },
        },
      }),
      catalogReady ? prisma.catalog_items.count() : Promise.resolve(0),
      catalogReady ? countMultiListCatalogSql(prisma) : Promise.resolve(0),
      catalogReady
        ? countDuplicateCatalogGroupsSql(prisma)
        : Promise.resolve(0),
      countListsMissingCoverSql(prisma),
      prisma.lists.count({
        where: {
          deletedAt: null,
          isActive: true,
          OR: [{ description: null }, { description: '' }],
        },
      }),
      countItemsMissingTipSql(prisma),
      catalogReady
        ? countCatalogImageHealthSql(prisma)
        : Promise.resolve({ externalImages: 0, missingPosters: 0 }),
    ])
  );

  const { externalImages: catalogExternalImages, missingPosters: catalogMissingPosters } =
    catalogImageHealth;

  const healthIssues: { label: string; count: number }[] = [
    { label: 'تصویر خارجی استوریج', count: catalogExternalImages },
    { label: 'tip خالی', count: itemsMissingTip },
    { label: 'توضیح لیست خالی', count: listsMissingDescription },
    { label: 'لیست بدون کاور', count: listsMissingCover },
    { label: 'کاتالوگ بدون تصویر', count: catalogMissingPosters },
    { label: 'تکراری کاتالوگ', count: duplicateCatalogGroups },
    { label: 'پیشنهاد در انتظار', count: suggestionsPending },
  ].filter((item) => item.count > 0);

  const parts = healthIssues.map(
    (item) => `${item.count.toLocaleString('fa-IR')} ${item.label}`
  );

  return {
    activeLists,
    catalogEntities,
    placements,
    multiListCatalog,
    duplicateCatalogGroups,
    lowEngagementLists,
    suggestionsPending,
    listsMissingCover,
    listsMissingDescription,
    catalogExternalImages,
    catalogMissingPosters,
    itemsMissingTip,
    insightLine:
      parts.length > 0 ? parts.join(' · ') : 'هیچ مورد بحرانی در صف کار نیست',
  };
}

function getCrossRequestCachedContentHubStats() {
  return unstable_cache(
    getContentHubStats,
    ['admin-content-hub-stats'],
    { revalidate: ADMIN_LISTS_CACHE_SECONDS, tags: [ADMIN_CACHE_TAGS.lists] }
  )();
}

/** Per-request dedupe + short TTL cross-request cache */
export const getCachedContentHubStats = cache(() =>
  getCrossRequestCachedContentHubStats()
);

export { CatalogNotReadyError };
