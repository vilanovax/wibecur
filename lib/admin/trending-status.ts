/**
 * Pure trending helpers — safe for client bundles (no Prisma).
 */

export type TrendingStatus = 'rising' | 'stable' | 'declining';

export const CATEGORY_WEIGHT = 1.2;
export const VELOCITY_FACTOR = 2;
export const RECENCY_BONUS = 10;
export const RECENCY_DAYS_THRESHOLD = 7;
export const DECAY_PER_DAY = 1;

export function computeScore(
  saveCount: number,
  saves24h: number,
  createdAt: Date,
  categoryWeight: number = CATEGORY_WEIGHT
): {
  finalScore: number;
  baseScore: number;
  velocityScore: number;
  recencyBoost: number;
  decay: number;
} {
  const now = new Date();
  const ageMs = now.getTime() - createdAt.getTime();
  const ageInDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  const baseScore = Math.round(saveCount * categoryWeight);
  const velocityScore = saves24h * VELOCITY_FACTOR;
  const recencyBoost = ageInDays < RECENCY_DAYS_THRESHOLD ? RECENCY_BONUS : 0;
  const decay = ageInDays * DECAY_PER_DAY;
  const finalScore = Math.round(baseScore + velocityScore + recencyBoost - decay);

  return { finalScore, baseScore, velocityScore, recencyBoost, decay };
}

export function getStatus(saves24h: number, saves7d: number): TrendingStatus {
  if (saves7d === 0) return 'stable';
  const avgPerDay = saves7d / 7;
  if (saves24h > avgPerDay * 1.2) return 'rising';
  if (saves24h < avgPerDay * 0.8) return 'declining';
  return 'stable';
}
