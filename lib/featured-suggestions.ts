/**
 * Smart Featured Suggestion Engine (MVP)
 * Rule-based, explainable. No ML.
 */

import type { PrismaClient } from '@prisma/client';
import { getFeaturedCategoryInsights } from '@/lib/featured-performance';
import { getRotationInsight } from '@/lib/featured-rotation';
import { getListMetrics7d } from '@/lib/trending/service';
import { calculateTrendingScore } from '@/lib/trending/score';

const CANDIDATE_LIMIT = 200;
const TOP_N = 5;
const RECENT_FEATURED_DAYS = 14;

/** نرمال‌سازی امتیاز ترند (حدود ۰–۵۰۰+) به مقیاس ۰–۱۰۰ */
function normTrending(score: number): number {
  return Math.min(score / 5, 100);
}

/** نرمال‌سازی رشد ذخیره (S7) به مقیاس ۰–۱۰۰ */
function normRecentSaveGrowth(S7: number): number {
  return Math.min(S7 * 2, 100);
}

export interface FeaturedSuggestionItem {
  listId: string;
  title: string;
  slug: string;
  coverImage: string | null;
  categoryId: string | null;
  categoryName: string | null;
  suggestionScore: number;
  trendingScore: number;
  saveVelocity: number;
  S7: number;
  categoryImpactScore: number;
  reasons: string[];
}

export interface FeaturedSuggestionsResult {
  suggestions: FeaturedSuggestionItem[];
  rotationInsight?: {
    categoryStats: { categoryId: string; name: string; countLast4: number; rotationModifier: number }[];
    suggestedCategory: string | null;
    reasoning: string;
  };
}

/**
 * لیست‌های واجد شرایط برای پیشنهاد:
 * - حذف‌نشده، فعال، عمومی
 * - در ۱۴ روز گذشته Featured نشده
 * - الان یا در آینده زمان‌بندی نشده
 */
export async function getFeaturedSuggestions(
  prisma: PrismaClient
): Promise<FeaturedSuggestionsResult> {
  const now = new Date();
  const cutoff14 = new Date(now);
  cutoff14.setDate(cutoff14.getDate() - RECENT_FEATURED_DAYS);
  cutoff14.setHours(0, 0, 0, 0);

  // 1) امتیاز تأثیر هر دسته (۳۰ روز) + چرخش دسته‌ها (۴ هفته)
  const [insights, rotationInsight] = await Promise.all([
    getFeaturedCategoryInsights(prisma, 30),
    getRotationInsight(prisma),
  ]);
  const categoryImpactMap = new Map<string, number>();
  for (const c of insights.categories) {
    categoryImpactMap.set(c.categoryId, c.impactScore);
  }
  const rotationModifiers = rotationInsight.modifiersByCategory;

  // 2) آخرین تاریخ Featured هر لیست
  const lastFeaturedSlots = await prisma.home_featured_slot.findMany({
    where: {},
    select: { listId: true, startAt: true, endAt: true },
  });
  const lastFeaturedByList = new Map<string, Date>();
  for (const s of lastFeaturedSlots) {
    const endOrStart = s.endAt ?? s.startAt;
    const cur = lastFeaturedByList.get(s.listId);
    if (!cur || endOrStart > cur) lastFeaturedByList.set(s.listId, endOrStart);
  }

  // 3) لیست‌هایی که الان یا در آینده زمان‌بندی شده‌اند (exclude)
  const scheduledSlots = await prisma.home_featured_slot.findMany({
    where: {
      OR: [
        { startAt: { lte: now }, OR: [{ endAt: { gte: now } }, { endAt: null }] },
        { startAt: { gt: now } },
      ],
    },
    select: { listId: true },
  });
  const scheduledListIds = new Set(scheduledSlots.map((s) => s.listId));

  // 4) لیست‌های واجد (حذف‌نشده، فعال)
  const lists = await prisma.lists.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      isPublic: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      categoryId: true,
      categories: { select: { name: true } },
    },
    orderBy: { saveCount: 'desc' },
    take: 500,
  });

  const eligible: typeof lists = [];
  for (const l of lists) {
    if (scheduledListIds.has(l.id)) continue;
    const lastFeatured = lastFeaturedByList.get(l.id);
    if (lastFeatured && lastFeatured >= cutoff14) continue;
    eligible.push(l);
  }

  if (eligible.length === 0) {
    return { suggestions: [] };
  }

  const eligibleIds = eligible.map((l) => l.id);
  const metricsMap = await getListMetrics7d(prisma, eligibleIds);

  // 5) امتیاز ترند برای هر کاندید، مرتب‌سازی و محدود به CANDIDATE_LIMIT
  const withTrending: { list: (typeof lists)[0]; trendingScore: number; metrics: { S7: number; SaveVelocity: number } }[] = [];
  for (const list of eligible) {
    const metrics = metricsMap.get(list.id);
    if (!metrics) continue;
    const trendingScore = calculateTrendingScore(metrics);
    withTrending.push({
      list,
      trendingScore,
      metrics: { S7: metrics.S7, SaveVelocity: metrics.SaveVelocity },
    });
  }
  withTrending.sort((a, b) => b.trendingScore - a.trendingScore);
  const candidates = withTrending.slice(0, CANDIDATE_LIMIT);

  // 6) محاسبه SuggestionScore و دلایل
  const categoryImpactDefault = 0;
  const scored: (FeaturedSuggestionItem & { _score: number })[] = [];

  for (const { list, trendingScore, metrics } of candidates) {
    const categoryImpactScore = (list.categoryId && categoryImpactMap.get(list.categoryId)) ?? categoryImpactDefault;
    const categoryNorm = Math.min(categoryImpactScore, 100);
    const trendingNorm = normTrending(trendingScore);
    const saveVelNorm = Math.min(metrics.SaveVelocity, 100);
    const recentGrowthNorm = normRecentSaveGrowth(metrics.S7);

    const baseSuggestionScore =
      trendingNorm * 0.4 +
      saveVelNorm * 0.2 +
      categoryNorm * 0.2 +
      recentGrowthNorm * 0.2;

    const rotationModifier = (list.categoryId && rotationModifiers[list.categoryId]) ?? 0;
    const suggestionScore = Math.max(0, baseSuggestionScore * (1 + rotationModifier));

    const reasons: string[] = [];
    if (trendingScore >= 300) reasons.push('امتیاز ترندینگ بالا');
    else if (trendingScore >= 150) reasons.push('امتیاز ترندینگ خوب');
    if (metrics.SaveVelocity >= 50) reasons.push('رشد ذخیره سریع در ۷ روز اخیر');
    if (metrics.S7 >= 20) reasons.push(`رشد ۷ روزه بالا (+${metrics.S7} ذخیره)`);
    if (categoryImpactScore >= 50) reasons.push('این دسته در Featured عملکرد قوی دارد');
    const lastFeatured = lastFeaturedByList.get(list.id);
    if (!lastFeatured || lastFeatured < cutoff14) reasons.push('مدت طولانی Featured نشده');
    if (rotationModifier > 0) reasons.push('این دسته در هفته‌های اخیر Featured نشده است.');
    if (rotationModifier < 0) reasons.push('این دسته اخیراً چند بار Featured شده است.');

    const categoryName = list.categories && typeof list.categories === 'object' && 'name' in list.categories
      ? (list.categories as { name: string }).name
      : null;

    scored.push({
      listId: list.id,
      title: list.title,
      slug: list.slug,
      coverImage: list.coverImage ?? null,
      categoryId: list.categoryId ?? null,
      categoryName,
      suggestionScore: Math.round(suggestionScore * 10) / 10,
      trendingScore: Math.round(trendingScore * 10) / 10,
      saveVelocity: Math.round(metrics.SaveVelocity * 10) / 10,
      S7: metrics.S7,
      categoryImpactScore: Math.round(categoryImpactScore * 10) / 10,
      reasons,
      _score: suggestionScore,
    });
  }

  scored.sort((a, b) => b._score - a._score);
  const top = scored.slice(0, TOP_N).map(({ _score, ...rest }) => rest);

  return {
    suggestions: top,
    rotationInsight: {
      categoryStats: rotationInsight.categoryStats.map((c) => ({
        categoryId: c.categoryId,
        name: c.name,
        countLast4: c.countLast4,
        rotationModifier: c.rotationModifier,
      })),
      suggestedCategory: rotationInsight.suggestedCategory,
      reasoning: rotationInsight.reasoning,
    },
  };
}
