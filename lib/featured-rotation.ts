/**
 * Featured Rotation Engine (MVP)
 * جلوگیری از تکرار ژانر، تنوع در Home. Rule-based، قابل توضیح.
 */

import type { PrismaClient } from '@prisma/client';

const LAST_N_SLOTS = 4;

/** امتیاز تعدیل برای هر دسته (برای ضرب در SuggestionScore) */
export const ROTATION = {
  PENALTY_OVEREXPOSED: -0.3,   // count >= 2 در ۴ هفته
  BOOST_NOT_FEATURED: 0.3,    // count === 0
  PENALTY_LAST_WEEK: -0.2,    // در آخرین اسلات آمده
} as const;

export interface CategoryRotationStat {
  categoryId: string;
  name: string;
  countLast4: number;
  /** آیا در آخرین اسلات (جدیدترین) آمده */
  inLastSlot: boolean;
  /** modifier نهایی برای امتیاز: finalScore = baseScore * (1 + rotationModifier) */
  rotationModifier: number;
}

export interface RotationInsightResult {
  categoryStats: CategoryRotationStat[];
  /** دسته‌ای که پیشنهاد می‌شود این هفته Featured شود (نام) */
  suggestedCategory: string | null;
  /** دسته‌ای که پیشنهاد می‌شود (id) */
  suggestedCategoryId: string | null;
  reasoning: string;
  /** برای اتصال به Suggestion Engine: categoryId -> modifier */
  modifiersByCategory: Record<string, number>;
}

/**
 * آخرین N اسلات Featured (مرتب بر اساس startAt نزولی).
 * برای هر دسته: تعداد دفعات، آیا در آخرین اسلات بوده، و rotation modifier.
 */
export async function getRotationInsight(
  prisma: PrismaClient,
  lastN: number = LAST_N_SLOTS
): Promise<RotationInsightResult> {
  const lastSlots = await prisma.home_featured_slot.findMany({
    orderBy: { startAt: 'desc' },
    take: lastN,
    include: {
      lists: {
        select: {
          categoryId: true,
          categories: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (lastSlots.length === 0) {
    return {
      categoryStats: [],
      suggestedCategory: null,
      suggestedCategoryId: null,
      reasoning: 'هنوز اسلات Featured ثبت نشده است.',
      modifiersByCategory: {},
    };
  }

  const mostRecentSlot = lastSlots[0];
  const mostRecentCategoryId = mostRecentSlot.lists?.categoryId ?? null;

  const countByCategory = new Map<string, { name: string; count: number; inLastSlot: boolean }>();
  for (const slot of lastSlots) {
    const categoryId = slot.lists?.categoryId ?? 'unknown';
    const categoryName = slot.lists?.categories && typeof slot.lists.categories === 'object' && 'name' in slot.lists.categories
      ? (slot.lists.categories as { name: string }).name
      : 'بدون دسته';
    const isMostRecentSlot = slot.id === mostRecentSlot.id;
    const cur = countByCategory.get(categoryId);
    if (!cur) {
      countByCategory.set(categoryId, {
        name: categoryName,
        count: 1,
        inLastSlot: isMostRecentSlot,
      });
    } else {
      cur.count += 1;
      if (isMostRecentSlot) cur.inLastSlot = true;
    }
  }

  const allCategories = await prisma.categories.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, name: true },
  });

  const categoryStats: CategoryRotationStat[] = [];
  const modifiersByCategory: Record<string, number> = {};

  for (const cat of allCategories) {
    const stat = countByCategory.get(cat.id);
    const countLast4 = stat?.count ?? 0;
    const inLastSlot = stat?.inLastSlot ?? false;

    let rotationModifier = 0;
    if (countLast4 >= 2) rotationModifier += ROTATION.PENALTY_OVEREXPOSED;
    if (countLast4 === 0) rotationModifier += ROTATION.BOOST_NOT_FEATURED;
    if (inLastSlot) rotationModifier += ROTATION.PENALTY_LAST_WEEK;

    categoryStats.push({
      categoryId: cat.id,
      name: cat.name,
      countLast4,
      inLastSlot,
      rotationModifier,
    });
    modifiersByCategory[cat.id] = rotationModifier;
  }

  // دسته‌هایی که در اسلات‌ها بودند ولی در لیست دسته‌های فعال نیستند (مثلاً حذف‌شده)
  for (const [categoryId, stat] of countByCategory) {
    if (modifiersByCategory[categoryId] !== undefined) continue;
    let rotationModifier = 0;
    if (stat.count >= 2) rotationModifier += ROTATION.PENALTY_OVEREXPOSED;
    if (stat.count === 0) rotationModifier += ROTATION.BOOST_NOT_FEATURED;
    if (stat.inLastSlot) rotationModifier += ROTATION.PENALTY_LAST_WEEK;
    categoryStats.push({
      categoryId,
      name: stat.name,
      countLast4: stat.count,
      inLastSlot: stat.inLastSlot,
      rotationModifier,
    });
    modifiersByCategory[categoryId] = rotationModifier;
  }

  // پیشنهاد: دسته با بیشترین modifier (ترجیح boost)
  const best = categoryStats
    .filter((c) => c.countLast4 <= 1)
    .sort((a, b) => b.rotationModifier - a.rotationModifier)[0];

  const suggestedCategory = best?.name ?? null;
  const suggestedCategoryId = best?.categoryId ?? null;

  const overexposed = categoryStats.filter((c) => c.countLast4 >= 2);
  const notFeatured = categoryStats.filter((c) => c.countLast4 === 0);

  let reasoning: string;
  if (overexposed.length > 0 && notFeatured.length > 0) {
    const overNames = overexposed.map((c) => `${c.name} (${c.countLast4} بار)`).join('، ');
    const notNames = notFeatured.map((c) => c.name).join('، ');
    reasoning = `در ۴ هفته اخیر، دسته‌های ${overNames} Featured شده‌اند. پیشنهاد می‌شود این هفته از دسته‌های ${notNames} استفاده شود.`;
  } else if (suggestedCategory) {
    reasoning = `پیشنهاد: این هفته از دسته «${suggestedCategory}» برای Featured استفاده شود.`;
  } else {
    reasoning = 'بر اساس تاریخچهٔ اخیر، تنوع دسته‌ها رعایت شده است.';
  }

  return {
    categoryStats,
    suggestedCategory,
    suggestedCategoryId,
    reasoning,
    modifiersByCategory,
  };
}
