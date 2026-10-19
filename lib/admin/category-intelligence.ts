/**
 * Category intelligence — DB fetchers + re-exports of pure helpers.
 * Client code should import from `category-intelligence-shared` to avoid Prisma.
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import {
  computeSaveGrowthPercent,
  EMPTY_GROWTH,
  type CategorySaveGrowthStats,
} from '@/lib/admin/category-intelligence-shared';

export * from '@/lib/admin/category-intelligence-shared';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** تعداد آیتم غیرتکراری هر دسته — بر اساس catalogItemId یا id جایگاه */
export async function getCategoryUniqueItemCountMap(
  prisma: PrismaClient,
  categoryIds: string[]
): Promise<Map<string, number>> {
  if (categoryIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<{ categoryId: string; count: number }[]>(
    Prisma.sql`
      SELECT l."categoryId" AS "categoryId",
             COUNT(DISTINCT COALESCE(i."catalogItemId", i.id))::int AS count
      FROM items i
      INNER JOIN lists l ON i."listId" = l.id
      WHERE l."deletedAt" IS NULL
        AND l."categoryId" IN (${Prisma.join(categoryIds)})
      GROUP BY l."categoryId"
    `
  );

  return new Map(rows.map((r) => [r.categoryId, r.count]));
}

/**
 * ذخیره ۷روز / هفته قبل per category — یک کوئری join (async-parallel / no waterfall).
 * قبلاً: findMany lists → سپس دو groupBy bookmarks.
 */
export async function getCategorySaveGrowthMap(
  prisma: PrismaClient,
  categoryIds: string[]
): Promise<Map<string, CategorySaveGrowthStats>> {
  const result = new Map<string, CategorySaveGrowthStats>();
  if (categoryIds.length === 0) return result;

  for (const id of categoryIds) result.set(id, { ...EMPTY_GROWTH });

  const now = new Date();
  const cutoff7 = new Date(now.getTime() - 7 * MS_PER_DAY);
  const cutoff14 = new Date(now.getTime() - 14 * MS_PER_DAY);

  const rows = await prisma.$queryRaw<
    { categoryId: string; recent: number; previous: number }[]
  >(Prisma.sql`
    SELECT l."categoryId" AS "categoryId",
           COUNT(*) FILTER (WHERE b."createdAt" >= ${cutoff7})::int AS recent,
           COUNT(*) FILTER (
             WHERE b."createdAt" >= ${cutoff14} AND b."createdAt" < ${cutoff7}
           )::int AS previous
    FROM bookmarks b
    INNER JOIN lists l ON b."listId" = l.id
    WHERE l."deletedAt" IS NULL
      AND l."categoryId" IN (${Prisma.join(categoryIds)})
      AND b."createdAt" >= ${cutoff14}
    GROUP BY l."categoryId"
  `);

  for (const row of rows) {
    if (!row.categoryId) continue;
    result.set(row.categoryId, {
      recent: row.recent,
      previous: row.previous,
      percent: computeSaveGrowthPercent(row.recent, row.previous),
    });
  }

  return result;
}
