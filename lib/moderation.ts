/**
 * Vibe Moderation Engine v1 – Weighted Flag Score
 * هدف: آیتم‌های مشکوک سریع دیده شوند، با گزارش فیک حذف نشوند، سازنده خوب آسیب نبیند.
 */

import { CuratorLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// ——— دلایل معتبر گزارش (هماهنگ با فرانت و API) ———
export const VALID_REPORT_REASONS = [
  'incorrect_info',
  'offensive',
  'spam',
  'wrong_category',
  'duplicate',
  'other',
] as const;

// ——— وزن نوع گزارش ———
export const REPORT_TYPE_WEIGHTS: Record<string, number> = {
  incorrect_info: 1,
  wrong_category: 0.8,
  spam: 1.5,
  offensive: 2,
  duplicate: 1,
  other: 1,
};

// ——— آستانه‌های وضعیت ———
export const FLAG_THRESHOLDS = {
  SOFT_FLAG: 3,
  UNDER_REVIEW: 5,
  HIDDEN: 8,
} as const;

export type ItemModerationStatusType = 'NORMAL' | 'SOFT_FLAG' | 'UNDER_REVIEW' | 'HIDDEN';

/** وزن اعتماد کاربر (۰.۵–۲) بر اساس سطح کریتور */
export function getUserTrustWeight(curatorLevel: CuratorLevel | null): number {
  if (!curatorLevel) return 0.7;
  switch (curatorLevel) {
    case 'EXPLORER':
      return 0.7;
    case 'NEW_CURATOR':
    case 'ACTIVE_CURATOR':
      return 1.0;
    case 'TRUSTED_CURATOR':
    case 'INFLUENTIAL_CURATOR':
      return 1.5;
    case 'ELITE_CURATOR':
    case 'VIBE_LEGEND':
      return 2.0;
    default:
      return 1.0;
  }
}

/** محاسبه وزن یک گزارش: User Trust × Report Type */
export function calcReportWeight(
  reportType: string,
  userTrustWeight: number
): number {
  const typeWeight = REPORT_TYPE_WEIGHTS[reportType] ?? 1;
  return Math.round((typeWeight * userTrustWeight) * 100) / 100;
}

/** تعیین وضعیت از روی امتیاز */
export function statusFromFlagScore(score: number): ItemModerationStatusType {
  if (score >= FLAG_THRESHOLDS.HIDDEN) return 'HIDDEN';
  if (score >= FLAG_THRESHOLDS.UNDER_REVIEW) return 'UNDER_REVIEW';
  if (score >= FLAG_THRESHOLDS.SOFT_FLAG) return 'SOFT_FLAG';
  return 'NORMAL';
}

/** بعد از ثبت گزارش: اضافه کردن وزن به آیتم و به‌روزرسانی وضعیت */
export async function applyReportWeight(
  itemId: string,
  weight: number
): Promise<ItemModerationStatusType> {
  const mod = await dbQuery(() =>
    prisma.item_moderation.upsert({
      where: { itemId },
      create: {
        itemId,
        flagScore: weight,
        status: statusFromFlagScore(weight),
      },
      update: {
        flagScore: { increment: weight },
      },
    })
  );

  const newScore = mod.flagScore;
  const newStatus = statusFromFlagScore(newScore);

  if (newStatus !== mod.status) {
    await dbQuery(() =>
      prisma.item_moderation.update({
        where: { itemId },
        data: { status: newStatus },
      })
    );
  }

  return newStatus;
}

/** بازمحاسبه وضعیت آیتم از روی گزارش‌های حل‌نشده (برای Recovery بعد از resolve) */
export async function recalcItemModeration(itemId: string): Promise<void> {
  const unresolved = await dbQuery(() =>
    prisma.item_reports.aggregate({
      where: { itemId, resolved: false },
      _sum: { weightSnapshot: true },
    })
  );

  const totalWeight = unresolved._sum.weightSnapshot ?? 0;
  const status = statusFromFlagScore(totalWeight);

  await dbQuery(() =>
    prisma.item_moderation.upsert({
      where: { itemId },
      create: {
        itemId,
        flagScore: totalWeight,
        status,
      },
      update: {
        flagScore: totalWeight,
        status,
      },
    })
  );
}

/** آیا این آیتم برای کاربر/ادمین قابل مشاهده است؟ (مثلاً وقتی HIDDEN است) */
export async function canViewHiddenItem(
  itemId: string,
  options: { userId?: string | null; isAdmin?: boolean }
): Promise<boolean> {
  const mod = await prisma.item_moderation.findUnique({
    where: { itemId },
    select: { status: true },
  });
  if (!mod || mod.status !== 'HIDDEN') return true;

  if (options.isAdmin) return true;
  if (!options.userId) return false;

  const item = await prisma.items.findUnique({
    where: { id: itemId },
    select: { lists: { select: { userId: true } } },
  });
  return item?.lists?.userId === options.userId;
}
