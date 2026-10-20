import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';
import {
  buildCategoryPulse,
  toCategoryIntelligenceRowFromAggregate,
  type CategoryAggregateMetrics,
  type CategoryRowSource,
} from '@/lib/admin/category-intelligence';
import { computeSaveGrowthPercent } from '@/lib/admin/category-intelligence-shared';
import {
  ADMIN_CACHE_TAGS,
  ADMIN_CATEGORIES_CACHE_SECONDS,
} from '@/lib/admin/admin-cache';

export type CategoriesIntelligencePayload = {
  pulse: ReturnType<typeof buildCategoryPulse>;
  categories: CategoryIntelligenceRow[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type CategoryStatsRow = {
  id: string;
  listCount: number;
  totalSaves: number;
  totalViews: number;
  activeListCount: number;
  uniqueItems: number;
  recent: number;
  previous: number;
};

/** لیست، آیتم یکتا و رشد ذخیره در یک رفت‌وبرگشت، هم‌زمان با خواندن خود دسته‌ها. */
async function loadCategoryStats(): Promise<Map<string, CategoryStatsRow>> {
  const now = new Date();
  const cutoff7 = new Date(now.getTime() - 7 * MS_PER_DAY);
  const cutoff14 = new Date(now.getTime() - 14 * MS_PER_DAY);

  const rows = await prisma.$queryRaw<CategoryStatsRow[]>(Prisma.sql`
    WITH list_stats AS (
      SELECT "categoryId" AS id,
             COUNT(*)::int AS "listCount",
             COALESCE(SUM("saveCount"), 0)::int AS "totalSaves",
             COALESCE(SUM("viewCount"), 0)::int AS "totalViews",
             COUNT(*) FILTER (WHERE "saveCount" > 0)::int AS "activeListCount"
      FROM lists
      WHERE "deletedAt" IS NULL
        AND "categoryId" IS NOT NULL
      GROUP BY "categoryId"
    ),
    item_stats AS (
      SELECT l."categoryId" AS id,
             COUNT(DISTINCT COALESCE(i."catalogItemId", i.id))::int AS "uniqueItems"
      FROM items i
      INNER JOIN lists l ON i."listId" = l.id
      WHERE l."deletedAt" IS NULL
        AND l."categoryId" IS NOT NULL
      GROUP BY l."categoryId"
    ),
    growth AS (
      SELECT l."categoryId" AS id,
             COUNT(*) FILTER (WHERE b."createdAt" >= ${cutoff7})::int AS recent,
             COUNT(*) FILTER (
               WHERE b."createdAt" >= ${cutoff14} AND b."createdAt" < ${cutoff7}
             )::int AS previous
      FROM bookmarks b
      INNER JOIN lists l ON b."listId" = l.id
      WHERE l."deletedAt" IS NULL
        AND l."categoryId" IS NOT NULL
        AND b."createdAt" >= ${cutoff14}
      GROUP BY l."categoryId"
    )
    SELECT COALESCE(ls.id, its.id, g.id) AS id,
           COALESCE(ls."listCount", 0)::int AS "listCount",
           COALESCE(ls."totalSaves", 0)::int AS "totalSaves",
           COALESCE(ls."totalViews", 0)::int AS "totalViews",
           COALESCE(ls."activeListCount", 0)::int AS "activeListCount",
           COALESCE(its."uniqueItems", 0)::int AS "uniqueItems",
           COALESCE(g.recent, 0)::int AS recent,
           COALESCE(g.previous, 0)::int AS previous
    FROM list_stats ls
    FULL OUTER JOIN item_stats its ON its.id = ls.id
    FULL OUTER JOIN growth g ON g.id = COALESCE(ls.id, its.id)
  `);

  return new Map(rows.map((row) => [row.id, row]));
}

async function fetchCategoriesIntelligenceData(): Promise<CategoriesIntelligencePayload> {
  const [categories, stats] = await Promise.all([
    dbQuery(() =>
      prisma.categories.findMany({
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
          description: true,
          order: true,
          isActive: true,
          trendingWeight: true,
          heroImage: true,
          layoutType: true,
        },
      })
    ),
    dbQuery(() => loadCategoryStats()),
  ]);

  if (categories.length === 0) {
    return {
      pulse: buildCategoryPulse([], 0),
      categories: [],
    };
  }

  const rows: CategoryIntelligenceRow[] = categories.map((cat) => {
    const stat = stats.get(cat.id);
    const recent = Number(stat?.recent ?? 0);
    const previous = Number(stat?.previous ?? 0);
    const agg: CategoryAggregateMetrics = {
      listCount: Number(stat?.listCount ?? 0),
      uniqueItemCount: Number(stat?.uniqueItems ?? 0),
      totalSaves: Number(stat?.totalSaves ?? 0),
      totalViews: Number(stat?.totalViews ?? 0),
      activeListCount: Number(stat?.activeListCount ?? 0),
    };
    const source: CategoryRowSource = {
      ...cat,
      trendingWeight: cat.trendingWeight ?? 1,
    };
    return toCategoryIntelligenceRowFromAggregate(
      source,
      {
        recent,
        previous,
        percent: computeSaveGrowthPercent(recent, previous),
      },
      agg
    );
  });

  return {
    pulse: buildCategoryPulse(rows, rows.length),
    categories: rows,
  };
}

function getCrossRequestCachedCategoriesIntelligence() {
  return unstable_cache(
    () => fetchCategoriesIntelligenceData(),
    ['admin-categories-intelligence-v2'],
    {
      revalidate: ADMIN_CATEGORIES_CACHE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.categories],
    }
  )();
}

/** Per-request dedupe + short TTL cross-request cache */
export const getCachedCategoriesIntelligenceData = cache(() =>
  getCrossRequestCachedCategoriesIntelligence()
);
