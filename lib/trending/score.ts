/**
 * تابع خالص محاسبه امتیاز ترند
 */

import {
  TRENDING_WEIGHTS,
  TRENDING_THRESHOLDS,
  FAST_RISING_BOOST,
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
  const { S7, L7, C7, V7, AgeDays, SaveVelocity } = metrics;
  const numerator =
    S7 * TRENDING_WEIGHTS.S7 +
    C7 * TRENDING_WEIGHTS.C7 +
    L7 * TRENDING_WEIGHTS.L7 +
    V7 * TRENDING_WEIGHTS.V7 +
    SaveVelocity * TRENDING_WEIGHTS.SAVE_VELOCITY;
  const denominator = 1 + AgeDays * TRENDING_WEIGHTS.AGE_DECAY;
  return Math.max(0, numerator / denominator);
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
 * محاسبه SaveVelocity
 * SaveVelocity = S7 / max(1, daysSinceLastSave)
 */
export function calculateSaveVelocity(
  S7: number,
  daysSinceLastSave: number
): number {
  if (S7 === 0) return 0;
  const divisor = Math.max(1, Math.ceil(daysSinceLastSave * 10) / 10);
  return S7 / divisor;
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
