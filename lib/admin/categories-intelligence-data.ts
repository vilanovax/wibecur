import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';
import {
  buildCategoryPulse,
  getCategorySaveGrowthMap,
  getCategoryUniqueItemCountMap,
  toCategoryIntelligenceRowFromAggregate,
  type CategoryAggregateMetrics,
  type CategoryRowSource,
} from '@/lib/admin/category-intelligence';
import {
  ADMIN_CACHE_TAGS,
  ADMIN_CATEGORIES_CACHE_SECONDS,
} from '@/lib/admin/admin-cache';

export type CategoriesIntelligencePayload = {
  pulse: ReturnType<typeof buildCategoryPulse>;
  categories: CategoryIntelligenceRow[];
};

async function fetchCategoriesIntelligenceData(): Promise<CategoriesIntelligencePayload> {
  const categories = await dbQuery(() =>
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
        _count: { select: { lists: { where: { deletedAt: null } } } },
      },
    })
  );

  if (categories.length === 0) {
    return {
      pulse: buildCategoryPulse([], 0),
      categories: [],
    };
  }

  const categoryIds = categories.map((c) => c.id);

  // All independent aggregations in parallel (async-parallel)
  const [growthMap, sumAgg, activeAgg, uniqueItemMap] = await Promise.all([
    dbQuery(() => getCategorySaveGrowthMap(prisma, categoryIds)),
    dbQuery(() =>
      prisma.lists.groupBy({
        by: ['categoryId'],
        where: { deletedAt: null, categoryId: { in: categoryIds } },
        _sum: { saveCount: true, viewCount: true },
        _count: { _all: true },
      })
    ),
    dbQuery(() =>
      prisma.lists.groupBy({
        by: ['categoryId'],
        where: {
          deletedAt: null,
          categoryId: { in: categoryIds },
          saveCount: { gt: 0 },
        },
        _count: { _all: true },
      })
    ),
    dbQuery(() => getCategoryUniqueItemCountMap(prisma, categoryIds)),
  ]);

  const sumByCat = new Map(
    sumAgg.map((g) => [
      g.categoryId!,
      {
        totalSaves: g._sum.saveCount ?? 0,
        totalViews: g._sum.viewCount ?? 0,
        listCount: g._count._all,
      },
    ])
  );
  const activeByCat = new Map(
    activeAgg.map((g) => [g.categoryId!, g._count._all])
  );

  const rows: CategoryIntelligenceRow[] = categories.map((cat) => {
    const sums = sumByCat.get(cat.id);
    const agg: CategoryAggregateMetrics = {
      listCount: cat._count.lists,
      uniqueItemCount: uniqueItemMap.get(cat.id) ?? 0,
      totalSaves: sums?.totalSaves ?? 0,
      totalViews: sums?.totalViews ?? 0,
      activeListCount: activeByCat.get(cat.id) ?? 0,
    };
    const source: CategoryRowSource = {
      ...cat,
      trendingWeight: cat.trendingWeight ?? 1,
    };
    return toCategoryIntelligenceRowFromAggregate(
      source,
      growthMap.get(cat.id) ?? { percent: 0, recent: 0, previous: 0 },
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
    ['admin-categories-intelligence'],
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
