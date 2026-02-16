/**
 * Featured Performance Analytics (MVP)
 * محاسبهٔ CTR، Save Lift، Score Lift و پیشنهادات rule-based.
 */

import type { PrismaClient } from '@prisma/client';

export interface FeaturedPerformanceResult {
  impressions: number;
  clicks: number;
  ctr: number;
  savesDuring: number;
  baselineSaves: number | null;
  saveLiftPercent: number | null;
  baselineScore: number | null;
  peakScore: number | null;
  scoreLiftPercent: number | null;
}

export async function getFeaturedPerformance(
  prisma: PrismaClient,
  slotId: string
): Promise<FeaturedPerformanceResult | null> {
  const slot = await prisma.home_featured_slot.findUnique({
    where: { id: slotId },
    select: {
      impressions: true,
      clicks: true,
      baselineSaves: true,
      savesDuring: true,
      baselineScore: true,
      peakScore: true,
    },
  });
  if (!slot) return null;

  const impressions = slot.impressions ?? 0;
  const clicks = slot.clicks ?? 0;
  const ctr = impressions > 0 ? clicks / impressions : 0;

  const baselineSaves = slot.baselineSaves ?? null;
  const savesDuring = slot.savesDuring ?? 0;
  const saveLiftPercent =
    baselineSaves != null && baselineSaves > 0
      ? (savesDuring / baselineSaves) * 100
      : null;

  const baselineScore = slot.baselineScore ?? null;
  const peakScore = slot.peakScore ?? null;
  const scoreLiftPercent =
    baselineScore != null &&
    baselineScore > 0 &&
    peakScore != null
      ? ((peakScore - baselineScore) / baselineScore) * 100
      : null;

  return {
    impressions,
    clicks,
    ctr,
    savesDuring,
    baselineSaves,
    saveLiftPercent,
    baselineScore,
    peakScore,
    scoreLiftPercent,
  };
}

/**
 * پیشنهادات rule-based بر اساس عملکرد اسلات.
 */
export function getFeaturedRecommendations(
  performance: FeaturedPerformanceResult | null
): string[] {
  if (!performance) return [];

  const out: string[] = [];
  const { ctr, saveLiftPercent, scoreLiftPercent } = performance;

  if (ctr > 0.18 && saveLiftPercent != null && saveLiftPercent > 200) {
    out.push('High Impact Featured: این لیست عملکرد بسیار قوی داشته است.');
  }
  if (ctr < 0.05) {
    out.push('CTR پایین است. تصویر یا عنوان نیاز به بهبود دارد.');
  }
  if (saveLiftPercent != null && saveLiftPercent < 50) {
    out.push('افزایش ذخیره پایین بوده. شاید دسته‌بندی مناسب نبوده.');
  }
  if (scoreLiftPercent != null && scoreLiftPercent > 150) {
    out.push('Featured باعث رشد چشمگیر در Trending شده است.');
  }

  return out;
}

/** برچسب تأثیر بر اساس CTR و Save Lift (برای جدول گزارش) */
export function getImpactLabel(
  ctr: number,
  saveLiftPercent: number | null
): 'High Impact' | 'Moderate' | 'Low Impact' {
  if (ctr >= 0.15 && saveLiftPercent != null && saveLiftPercent >= 150) return 'High Impact';
  if (ctr >= 0.08 || (saveLiftPercent != null && saveLiftPercent >= 80)) return 'Moderate';
  return 'Low Impact';
}

export interface SlotPerformanceRow {
  slotId: string;
  listTitle: string;
  listId: string;
  categoryName: string | null;
  categoryId: string | null;
  ctr: number;
  saveLiftPercent: number | null;
  scoreLiftPercent: number | null;
  impactLabel: 'High Impact' | 'Moderate' | 'Low Impact';
}

export interface WeeklyReportResult {
  weekStart: string;
  weekEnd: string;
  totalSlots: number;
  avgCTR: number;
  avgSaveLift: number | null;
  bestPerformer: { listTitle: string; listId: string; saveLiftPercent: number } | null;
  slots: SlotPerformanceRow[];
  recommendations: string[];
}

/**
 * گزارش هفتگی اسلات‌های Featured.
 * بازه: startOfWeek (۰۰:۰۰) تا endOfWeek (پایان روز هفتم).
 * اسلات‌هایی که startAt در این بازه باشند.
 */
export async function getWeeklyFeaturedReport(
  prisma: PrismaClient,
  weekStart: Date
): Promise<WeeklyReportResult> {
  const endOfWeek = new Date(weekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  const slots = await prisma.home_featured_slot.findMany({
    where: {
      startAt: { gte: weekStart, lt: endOfWeek },
    },
    include: {
      lists: {
        select: {
          id: true,
          title: true,
          categoryId: true,
          categories: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { startAt: 'asc' },
  });

  const rows: SlotPerformanceRow[] = [];
  let sumCTR = 0;
  let sumSaveLift = 0;
  let saveLiftCount = 0;
  let bestPerformer: { listTitle: string; listId: string; saveLiftPercent: number } | null = null;

  for (const s of slots) {
    const impressions = s.impressions ?? 0;
    const clicks = s.clicks ?? 0;
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const baselineSaves = s.baselineSaves ?? null;
    const savesDuring = s.savesDuring ?? 0;
    const saveLiftPercent =
      baselineSaves != null && baselineSaves > 0
        ? (savesDuring / baselineSaves) * 100
        : null;
    const baselineScore = s.baselineScore ?? null;
    const peakScore = s.peakScore ?? null;
    const scoreLiftPercent =
      baselineScore != null && baselineScore > 0 && peakScore != null
        ? ((peakScore - baselineScore) / baselineScore) * 100
        : null;

    sumCTR += ctr;
    if (saveLiftPercent != null) {
      sumSaveLift += saveLiftPercent;
      saveLiftCount++;
      if (!bestPerformer || saveLiftPercent > bestPerformer.saveLiftPercent) {
        bestPerformer = {
          listTitle: s.lists?.title ?? '—',
          listId: s.listId,
          saveLiftPercent,
        };
      }
    }

    const cat = s.lists?.categories;
    const categoryName = cat && typeof cat === 'object' && 'name' in cat ? (cat as { name: string }).name : null;
    const categoryId = s.lists?.categoryId ?? null;

    rows.push({
      slotId: s.id,
      listTitle: s.lists?.title ?? '—',
      listId: s.listId,
      categoryName,
      categoryId,
      ctr,
      saveLiftPercent,
      scoreLiftPercent,
      impactLabel: getImpactLabel(ctr, saveLiftPercent),
    });
  }

  const totalSlots = slots.length;
  const avgCTR = totalSlots > 0 ? sumCTR / totalSlots : 0;
  const avgSaveLift = saveLiftCount > 0 ? sumSaveLift / saveLiftCount : null;

  const recommendations: string[] = [];
  if (avgCTR < 0.08) {
    recommendations.push('میانگین CTR پایین است. پیشنهاد: بهبود طراحی Hero یا تصویر و عنوان.');
  }
  if (avgSaveLift != null && avgSaveLift < 50) {
    recommendations.push('میانگین Save Lift پایین. پیشنهاد: امتحان دسته‌بندی‌های دیگر برای Featured.');
  }
  if (avgSaveLift != null && avgSaveLift >= 150 && avgCTR < 0.1) {
    recommendations.push('Hero جذابیت کلیک پایین دارد؛ لیست‌ها خوب عمل می‌کنند. تصویر یا عنوان Hero را تقویت کنید.');
  }
  if (avgCTR >= 0.12 && avgSaveLift != null && avgSaveLift < 80) {
    recommendations.push('CTR بالا ولی Save Lift پایین: عنوان یا تصویر قوی است ولی محتوا انتظار را برآورده نکرده.');
  }

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: endOfWeek.toISOString(),
    totalSlots,
    avgCTR,
    avgSaveLift,
    bestPerformer,
    slots: rows,
    recommendations,
  };
}

export interface CategoryInsightRow {
  categoryId: string;
  categoryName: string;
  featuredCount: number;
  avgCTR: number;
  avgSaveLift: number | null;
  avgScoreLift: number | null;
  impactScore: number;
  rank: number;
}

export interface CategoryInsightsResult {
  range: string;
  start: string;
  end: string;
  categories: CategoryInsightRow[];
  recommendations: string[];
}

/**
 * بینش دسته‌بندی: عملکرد Featured به تفکیک دسته.
 * impactScore = (avgSaveLift * 0.6) + (avgCTR * 0.4) — نرمال‌سازی برای مقایسه.
 */
export async function getFeaturedCategoryInsights(
  prisma: PrismaClient,
  rangeDays: number = 30
): Promise<CategoryInsightsResult> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  start.setHours(0, 0, 0, 0);

  const slots = await prisma.home_featured_slot.findMany({
    where: { startAt: { gte: start } },
    include: {
      lists: {
        select: {
          id: true,
          title: true,
          categoryId: true,
          categories: { select: { id: true, name: true } },
        },
      },
    },
  });

  const byCategory = new Map<
    string,
    { name: string; ctrSum: number; saveLiftSum: number; scoreLiftSum: number; count: number; saveLiftCount: number; scoreLiftCount: number }
  >();

  for (const s of slots) {
    const categoryId = s.lists?.categoryId ?? 'unknown';
    const categoryName = s.lists?.categories && typeof s.lists.categories === 'object' && 'name' in s.lists.categories
      ? (s.lists.categories as { name: string }).name
      : 'بدون دسته';

    const impressions = s.impressions ?? 0;
    const clicks = s.clicks ?? 0;
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const baselineSaves = s.baselineSaves ?? null;
    const savesDuring = s.savesDuring ?? 0;
    const saveLiftPercent =
      baselineSaves != null && baselineSaves > 0 ? (savesDuring / baselineSaves) * 100 : null;
    const baselineScore = s.baselineScore ?? null;
    const peakScore = s.peakScore ?? null;
    const scoreLiftPercent =
      baselineScore != null && baselineScore > 0 && peakScore != null
        ? ((peakScore - baselineScore) / baselineScore) * 100
        : null;

    const cur = byCategory.get(categoryId);
    if (!cur) {
      byCategory.set(categoryId, {
        name: categoryName,
        ctrSum: ctr,
        saveLiftSum: saveLiftPercent ?? 0,
        scoreLiftSum: scoreLiftPercent ?? 0,
        count: 1,
        saveLiftCount: saveLiftPercent != null ? 1 : 0,
        scoreLiftCount: scoreLiftPercent != null ? 1 : 0,
      });
    } else {
      cur.ctrSum += ctr;
      cur.count += 1;
      if (saveLiftPercent != null) {
        cur.saveLiftSum += saveLiftPercent;
        cur.saveLiftCount += 1;
      }
      if (scoreLiftPercent != null) {
        cur.scoreLiftSum += scoreLiftPercent;
        cur.scoreLiftCount += 1;
      }
    }
  }

  const categories: CategoryInsightRow[] = [];
  let rank = 1;
  for (const [categoryId, v] of byCategory.entries()) {
    const avgCTR = v.count > 0 ? v.ctrSum / v.count : 0;
    const avgSaveLift = v.saveLiftCount > 0 ? v.saveLiftSum / v.saveLiftCount : null;
    const avgScoreLift = v.scoreLiftCount > 0 ? v.scoreLiftSum / v.scoreLiftCount : null;
    const impactScore = (avgSaveLift ?? 0) * 0.6 + avgCTR * 100 * 0.4;
    categories.push({
      categoryId,
      categoryName: v.name,
      featuredCount: v.count,
      avgCTR,
      avgSaveLift,
      avgScoreLift,
      impactScore,
      rank: 0,
    });
  }

  categories.sort((a, b) => b.impactScore - a.impactScore);
  categories.forEach((c, i) => {
    c.rank = i + 1;
  });

  const recommendations: string[] = [];
  if (categories.length > 0) {
    const top = categories[0];
    recommendations.push(`دسته «${top.categoryName}» در بازهٔ اخیر بیشترین امتیاز تأثیر (${top.impactScore.toFixed(1)}) را داشته. پیشنهاد: بیشتر از این دسته Featured بگذارید.`);
  }
  if (categories.length > 1) {
    const last = categories[categories.length - 1];
    if (last.impactScore < 20) {
      recommendations.push(`دسته «${last.categoryName}» عملکرد ضعیف در Featured داشته. پیشنهاد: بازبینی انتخاب لیست‌های این دسته یا زمان‌بندی.`);
    }
  }
  const withHighCTRLowSave = categories.find(
    (c) => (c.avgCTR >= 0.1 && c.avgSaveLift != null && c.avgSaveLift < 60)
  );
  if (withHighCTRLowSave) {
    recommendations.push(`دسته «${withHighCTRLowSave.categoryName}» CTR بالا ولی Save Lift پایین دارد؛ احتمالاً عنوان جذاب ولی محتوا ضعیف.`);
  }

  return {
    range: `last${rangeDays}days`,
    start: start.toISOString(),
    end: end.toISOString(),
    categories,
    recommendations,
  };
}
