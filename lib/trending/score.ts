/**
 * تابع خالص محاسبه امتیاز ترند
 */

import {
  TRENDING_WEIGHTS,
  TRENDING_THRESHOLDS,
  FAST_RISING_BOOST,
  SAVE_VELOCITY_MAX,
} from './constants';

export interface ListMetrics7d {
  S7: number;
  L7: number;
  C7: number;
  V7: number;
  AgeDays: number;
  SaveVelocity: number;
}

export type TrendingBadge = 'none' | 'hot' | 'viral';

/**
 * محاسبه امتیاز ترند بر اساس فرمول وایب
 *
 * TrendingScore =
 *   (S7×4 + C7×3 + L7×2 + V7×0.5 + SaveVelocity×5)
 *   ÷ (1 + AgeDays×0.1)
 */
export function calculateTrendingScore(metrics: ListMetrics7d): number {
  const result = calculateTrendingScoreWithDebug(metrics);
  return typeof result === 'number' ? result : result.score;
}

export interface TrendScoreDebugResult {
  score: number;
  numerator: number;
  denominator: number;
  breakdown: {
    S7: number;
    C7: number;
    L7: number;
    V7: number;
    SaveVelocity: number;
    AgeDays: number;
    weighted: {
      S7_weighted: number;
      C7_weighted: number;
      L7_weighted: number;
      V7_weighted: number;
      SaveVelocity_weighted: number;
    };
  };
  warnings: string[];
}

/**
 * همان فرمول امتیاز با خروجی تفکیک‌شده و هشدارها (فقط برای Debug).
 * warnings فقط اطلاعاتی‌اند و روی score اثری ندارند.
 */
export function calculateTrendingScoreWithDebug(
  metrics: ListMetrics7d,
  opts?: { rawVelocity?: number }
): TrendScoreDebugResult {
  const { S7, L7, C7, V7, AgeDays, SaveVelocity } = metrics;
  const S7_weighted = S7 * TRENDING_WEIGHTS.S7;
  const C7_weighted = C7 * TRENDING_WEIGHTS.C7;
  const L7_weighted = L7 * TRENDING_WEIGHTS.L7;
  const V7_weighted = V7 * TRENDING_WEIGHTS.V7;
  const SaveVelocity_weighted = SaveVelocity * TRENDING_WEIGHTS.SAVE_VELOCITY;
  const numerator =
    S7_weighted + C7_weighted + L7_weighted + V7_weighted + SaveVelocity_weighted;
  const denominator = 1 + AgeDays * TRENDING_WEIGHTS.AGE_DECAY;
  const score = Math.max(0, numerator / denominator);

  const warnings: string[] = [];
  const rawVelocity = opts?.rawVelocity;
  if (rawVelocity != null && rawVelocity > 50) {
    warnings.push('Velocity spike detected');
  }
  if (S7 < 3 && SaveVelocity_weighted > 25) {
    warnings.push('Low save count but high velocity');
  }
  if (S7 > 0 && L7 > S7 * 5) {
    warnings.push('Like/save ratio suspicious');
  }
  if (S7 > 0 && C7 > S7 * 3) {
    warnings.push('Comment/save ratio suspicious');
  }

  return {
    score,
    numerator,
    denominator,
    breakdown: {
      S7,
      C7,
      L7,
      V7,
      SaveVelocity,
      AgeDays,
      weighted: {
        S7_weighted,
        C7_weighted,
        L7_weighted,
        V7_weighted,
        SaveVelocity_weighted,
      },
    },
    warnings,
  };
}

/**
 * تعیین بج بر اساس امتیاز
 */
export function getTrendingBadge(score: number): TrendingBadge {
  if (score >= TRENDING_THRESHOLDS.VIRAL) return 'viral';
  if (score >= TRENDING_THRESHOLDS.HOT) return 'hot';
  return 'none';
}

/**
 * محاسبه SaveVelocity با محافظت ضد اسپایک (MVP-safe).
 * - daysSinceLastSave حداقل ۱ روز تا مخرج صفر نشود و امتیاز منفجر نشود.
 * - سقف SaveVelocity تا لیست با یک save تازه کل رتبه را جابجا نکند.
 */
export function calculateSaveVelocity(
  S7: number,
  daysSinceLastSave: number
): number {
  if (S7 === 0) return 0;
  const daysClamped = Math.max(1, daysSinceLastSave);
  const divisor = Math.max(1, Math.ceil(daysClamped * 10) / 10);
  const rawVelocity = S7 / divisor;
  return Math.min(rawVelocity, SAVE_VELOCITY_MAX);
}

/**
 * بوست Fast Rising: اگر S1 > 20 → +20
 */
export function applyFastRisingBoost(score: number, S1: number): number {
  if (S1 >= FAST_RISING_BOOST.S1_THRESHOLD) {
    return score + FAST_RISING_BOOST.BONUS;
  }
  return score;
}
