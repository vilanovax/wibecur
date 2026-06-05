/**
 * محاسبه متریک‌های دسته‌بندی برای پنل ادمین — منبع واحد
 */

import type { PrismaClient } from '@prisma/client';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const SLUG_REGEX = /^[a-z0-9-]+$/;

export function isValidCategorySlug(slug: string): boolean {
  return slug.length > 0 && SLUG_REGEX.test(slug);
}

export type CategoryListMetrics = {
  listCount: number;
  engagementRatio: number;
  activeListsPercent: number;
  avgSavesPerList: number;
};

export type CategoryAggregateMetrics = {
  listCount: number;
  totalSaves: number;
  totalViews: number;
  activeListCount: number;
};

export function computeCategoryListMetricsFromAggregate(
  agg: CategoryAggregateMetrics
): CategoryListMetrics {
  const { listCount, totalSaves, totalViews, activeListCount } = agg;
  const engagementRatio = totalViews > 0 ? (totalSaves / totalViews) * 100 : 0;
  const activeListsPercent = listCount > 0 ? (activeListCount / listCount) * 100 : 0;
  const avgSavesPerList = listCount > 0 ? totalSaves / listCount : 0;
  return {
    listCount,
    engagementRatio,
    activeListsPercent,
    avgSavesPerList,
  };
}

export function computeCategoryListMetrics(
  lists: { saveCount: number; viewCount: number }[]
): CategoryListMetrics {
  const listCount = lists.length;
  const totalSaves = lists.reduce((s, l) => s + l.saveCount, 0);
  const totalViews = lists.reduce((s, l) => s + l.viewCount, 0);
  const engagementRatio = totalViews > 0 ? (totalSaves / totalViews) * 100 : 0;
  const activeLists = lists.filter((l) => l.saveCount > 0).length;
  const activeListsPercent = listCount > 0 ? (activeLists / listCount) * 100 : 0;
  const avgSavesPerList = listCount > 0 ? totalSaves / listCount : 0;

  return {
    listCount,
    engagementRatio,
    activeListsPercent,
    avgSavesPerList,
  };
}

export type CategorySaveGrowthStats = {
  percent: number;
  recent: number;
  previous: number;
};

const EMPTY_GROWTH: CategorySaveGrowthStats = { percent: 0, recent: 0, previous: 0 };

export function computeSaveGrowthPercent(recent: number, previous: number): number {
  if (previous > 0) {
    return Math.round(((recent - previous) / previous) * 1000) / 10;
  }
  return recent > 0 ? 100 : 0;
}

export type SaveGrowthDisplayTone = 'positive' | 'negative' | 'neutral' | 'new';

export type SaveGrowthDisplay = {
  label: string;
  title: string;
  tone: SaveGrowthDisplayTone;
};

const GROWTH_CAP = 200;

/** نمایش خوانا برای رشد ۷ روزه — بدون اعداد گمراه‌کننده مثل +۱۰۰۰٪ */
export function formatSaveGrowthDisplay(
  recent: number,
  previous: number,
  percent: number
): SaveGrowthDisplay {
  if (recent === 0 && previous === 0) {
    return {
      label: '—',
      title: 'بدون ذخیره در ۷ روز اخیر و هفته قبل',
      tone: 'neutral',
    };
  }
  if (previous === 0 && recent > 0) {
    return {
      label: 'جدید',
      title: `${recent.toLocaleString('fa-IR')} ذخیره در ۷ روز اخیر؛ هفته قبل فعالیتی نبود`,
      tone: 'new',
    };
  }
  if (percent > GROWTH_CAP) {
    return {
      label: `+${GROWTH_CAP.toLocaleString('fa-IR')}٪+`,
      title: `رشد واقعی ${percent.toLocaleString('fa-IR')}٪ نسبت به ۷ روز قبل`,
      tone: 'positive',
    };
  }
  if (percent < -GROWTH_CAP) {
    return {
      label: `−${GROWTH_CAP.toLocaleString('fa-IR')}٪−`,
      title: `افت واقعی ${percent.toLocaleString('fa-IR')}٪ نسبت به ۷ روز قبل`,
      tone: 'negative',
    };
  }
  const sign = percent > 0 ? '+' : '';
  return {
    label: `${sign}${percent.toLocaleString('fa-IR')}٪`,
    title: `۷ روز اخیر: ${recent.toLocaleString('fa-IR')} ذخیره · هفته قبل: ${previous.toLocaleString('fa-IR')}`,
    tone: percent > 0 ? 'positive' : percent < 0 ? 'negative' : 'neutral',
  };
}

/** ذخیره‌های ۷ روز اخیر و ۷ روز قبل — بر اساس categoryId */
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

  const lists = await prisma.lists.findMany({
    where: { categoryId: { in: categoryIds }, deletedAt: null },
    select: { id: true, categoryId: true },
  });

  if (lists.length === 0) {
    return result;
  }

  const listIdToCategory = new Map(lists.map((l) => [l.id, l.categoryId]));
  const listIds = lists.map((l) => l.id);

  const [recentGroups, previousGroups] = await Promise.all([
    prisma.bookmarks.groupBy({
      by: ['listId'],
      where: { listId: { in: listIds }, createdAt: { gte: cutoff7 } },
      _count: { _all: true },
    }),
    prisma.bookmarks.groupBy({
      by: ['listId'],
      where: {
        listId: { in: listIds },
        createdAt: { gte: cutoff14, lt: cutoff7 },
      },
      _count: { _all: true },
    }),
  ]);

  const recentByCat = new Map<string, number>();
  const prevByCat = new Map<string, number>();

  for (const g of recentGroups) {
    const catId = listIdToCategory.get(g.listId);
    if (!catId) continue;
    recentByCat.set(catId, (recentByCat.get(catId) ?? 0) + g._count._all);
  }
  for (const g of previousGroups) {
    const catId = listIdToCategory.get(g.listId);
    if (!catId) continue;
    prevByCat.set(catId, (prevByCat.get(catId) ?? 0) + g._count._all);
  }

  for (const catId of categoryIds) {
    const recent = recentByCat.get(catId) ?? 0;
    const previous = prevByCat.get(catId) ?? 0;
    result.set(catId, {
      recent,
      previous,
      percent: computeSaveGrowthPercent(recent, previous),
    });
  }

  return result;
}

export const MONETIZABLE_KPI_TOOLTIP =
  'دسته‌هایی با حداقل ۲ لیست، یا نرخ تعامل (ذخیره÷بازدید) حداقل ۲٪';

/** همان آستانه دکمه Boost در کارت */
export const CATEGORY_BOOST_WEIGHT = 1.2;

export function needsAlgorithmBoost(
  row: Pick<CategoryIntelligenceRow, 'isActive' | 'trendingWeight'>
): boolean {
  return row.isActive && (row.trendingWeight ?? 1) < CATEGORY_BOOST_WEIGHT - 0.001;
}

export function buildCategoryInsightLine(rows: CategoryIntelligenceRow[]): string {
  const active = rows.filter((r) => r.isActive);
  if (active.length === 0) {
    return 'هیچ دسته فعالی وجود ندارد.';
  }

  const withSignal = active.filter((r) => r.saveGrowthRecent > 0 || r.listCount > 0);
  const boostCount = rows.filter(needsAlgorithmBoost).length;

  if (withSignal.length === 0) {
    return boostCount > 0
      ? `${boostCount.toLocaleString('fa-IR')} دسته فعال با وزن الگوریتمی زیر ${CATEGORY_BOOST_WEIGHT}× — آماده Boost`
      : 'دسته‌های فعال هنوز ذخیره یا لیست قابل‌سنجی ندارند.';
  }

  const top = [...withSignal].sort((a, b) => {
    const scoreA = a.saveGrowthRecent > 0 ? a.saveGrowthRecent * 10 + a.engagementRatio : a.engagementRatio;
    const scoreB = b.saveGrowthRecent > 0 ? b.saveGrowthRecent * 10 + b.engagementRatio : b.engagementRatio;
    return scoreB - scoreA;
  })[0];

  const growth = formatSaveGrowthDisplay(
    top.saveGrowthRecent,
    top.saveGrowthPrevious,
    top.saveGrowthPercent
  );

  const parts = [`سریع‌ترین رشد: «${top.name}» — ${growth.label}`];
  if (boostCount > 0) {
    parts.push(
      `${boostCount.toLocaleString('fa-IR')} دسته با وزن زیر ${CATEGORY_BOOST_WEIGHT.toLocaleString('fa-IR')}×`
    );
  }
  return parts.join(' · ');
}

export function isMonetizableCategory(row: Pick<CategoryIntelligenceRow, 'listCount' | 'engagementRatio'>): boolean {
  return row.listCount >= 2 || row.engagementRatio >= 2;
}

export function getCategoryBadgeFlags(row: CategoryIntelligenceRow) {
  const engagement = row.engagementRatio;
  const growth = row.saveGrowthPercent;
  const isNewActivity = row.saveGrowthPrevious === 0 && row.saveGrowthRecent > 0;
  return {
    isFastRising: isNewActivity || growth > 10 || row.avgSavesPerList >= 50,
    isLowEngagement: engagement < 10 && row.listCount > 0,
    isMonetizable: isMonetizableCategory(row),
    isDeclining: growth < 0 && !isNewActivity,
  };
}

export type CategoryBadgeFlags = ReturnType<typeof getCategoryBadgeFlags>;

export type CategoryWithLists = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  order: number;
  isActive: boolean;
  trendingWeight: number;
  heroImage?: string | null;
  layoutType?: string | null;
  lists: { saveCount: number; viewCount: number }[];
};

export type CategoryRowSource = Omit<CategoryWithLists, 'lists'>;

export function toCategoryIntelligenceRow(
  cat: CategoryWithLists,
  growth: CategorySaveGrowthStats = EMPTY_GROWTH
): CategoryIntelligenceRow {
  const metrics = computeCategoryListMetrics(cat.lists);
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    color: cat.color,
    description: cat.description,
    order: cat.order,
    isActive: cat.isActive,
    trendingWeight: cat.trendingWeight,
    listCount: metrics.listCount,
    saveGrowthPercent: growth.percent,
    saveGrowthRecent: growth.recent,
    saveGrowthPrevious: growth.previous,
    engagementRatio: metrics.engagementRatio,
    activeListsPercent: metrics.activeListsPercent,
    avgSavesPerList: Math.round(metrics.avgSavesPerList * 10) / 10,
    heroImage: cat.heroImage ?? null,
    layoutType: cat.layoutType ?? null,
  };
}

export function toCategoryIntelligenceRowFromAggregate(
  cat: CategoryRowSource,
  growth: CategorySaveGrowthStats,
  agg: CategoryAggregateMetrics
): CategoryIntelligenceRow {
  const metrics = computeCategoryListMetricsFromAggregate(agg);
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    color: cat.color,
    description: cat.description,
    order: cat.order,
    isActive: cat.isActive,
    trendingWeight: cat.trendingWeight,
    listCount: metrics.listCount,
    saveGrowthPercent: growth.percent,
    saveGrowthRecent: growth.recent,
    saveGrowthPrevious: growth.previous,
    engagementRatio: metrics.engagementRatio,
    activeListsPercent: metrics.activeListsPercent,
    avgSavesPerList: Math.round(metrics.avgSavesPerList * 10) / 10,
    heroImage: cat.heroImage ?? null,
    layoutType: cat.layoutType ?? null,
  };
}

export function buildCategoryPulse(
  rows: CategoryIntelligenceRow[],
  totalCount: number
): {
  totalCategories: number;
  fastestGrowingName: string;
  fastestGrowingPercent: number;
  avgSaveGrowthPercent: number;
  monetizableCount: number;
  insightLine: string;
} {
  const activeRows = rows.filter((r) => r.listCount > 0);
  const fastest = [...activeRows].sort((a, b) => b.saveGrowthPercent - a.saveGrowthPercent)[0];
  const avgSaveGrowth =
    rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.saveGrowthPercent, 0) / rows.length) * 10) / 10
      : 0;

  return {
    totalCategories: totalCount,
    fastestGrowingName: fastest?.name ?? '—',
    fastestGrowingPercent: fastest?.saveGrowthPercent ?? 0,
    avgSaveGrowthPercent: avgSaveGrowth,
    monetizableCount: rows.filter(isMonetizableCategory).length,
    insightLine: buildCategoryInsightLine(rows),
  };
}
