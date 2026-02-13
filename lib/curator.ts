/**
 * Curator Level & Score system (creator-focused platform).
 * Score formula and level thresholds.
 */

export type CuratorLevelKey =
  | 'EXPLORER'
  | 'NEW_CURATOR'
  | 'ACTIVE_CURATOR'
  | 'TRUSTED_CURATOR'
  | 'INFLUENTIAL_CURATOR'
  | 'ELITE_CURATOR'
  | 'VIBE_LEGEND';

export interface CuratorStats {
  listsCount: number;
  avgLikesPerList: number;
  approvedItemsCount: number;
  savedCount: number; // total saveCount across user's lists
  viralListsCount: number;
}

export interface CuratorResult {
  score: number;
  level: CuratorLevelKey;
  levelLabel: string;
  levelLabelShort: string;
  nextLevel: CuratorLevelKey | null;
  nextLevelLabel: string | null;
  pointsToNextLevel: number | null;
  minScoreForCurrent: number;
  minScoreForNext: number | null;
}

const LEVEL_THRESHOLDS: { min: number; key: CuratorLevelKey; label: string; short: string }[] = [
  { min: 0, key: 'EXPLORER', label: 'Explorer', short: 'اکسپلورر' },
  { min: 50, key: 'NEW_CURATOR', label: 'New Curator', short: 'تازه‌کار' },
  { min: 150, key: 'ACTIVE_CURATOR', label: 'Active Curator', short: 'فعال' },
  { min: 300, key: 'TRUSTED_CURATOR', label: 'Trusted Curator', short: 'معتمد' },
  { min: 500, key: 'INFLUENTIAL_CURATOR', label: 'Influential Curator', short: 'تاثیرگذار' },
  { min: 800, key: 'ELITE_CURATOR', label: 'Elite Curator', short: 'برتر' },
  { min: 1200, key: 'VIBE_LEGEND', label: 'Vibe Legend', short: 'افسانه' },
];

export function getLevelByScore(score: number): (typeof LEVEL_THRESHOLDS)[number] {
  let current = LEVEL_THRESHOLDS[0];
  for (const tier of LEVEL_THRESHOLDS) {
    if (score >= tier.min) current = tier;
  }
  return current;
}

export function getNextLevelByScore(score: number): (typeof LEVEL_THRESHOLDS)[number] | null {
  const idx = LEVEL_THRESHOLDS.findIndex((t) => t.min > score);
  if (idx === -1) return null;
  return LEVEL_THRESHOLDS[idx];
}

export function pointsToNextLevel(score: number): number | null {
  const next = getNextLevelByScore(score);
  if (!next) return null;
  return next.min - score;
}

/**
 * Calculate curator score from stats.
 * Formula:
 *   (listsCount * 10)
 *   + (avgLikesPerList * 5)
 *   + (approvedItemsCount * 3)
 *   + (savedCount * 2)
 *   + (viralListsCount * 30)
 */
export function calculateCuratorScore(stats: CuratorStats): number {
  const {
    listsCount,
    avgLikesPerList,
    approvedItemsCount,
    savedCount,
    viralListsCount,
  } = stats;
  const score =
    listsCount * 10 +
    Math.round(avgLikesPerList) * 5 +
    approvedItemsCount * 3 +
    savedCount * 2 +
    viralListsCount * 30;
  return Math.max(0, score);
}

export function calculateCuratorResult(stats: CuratorStats): CuratorResult {
  const score = calculateCuratorScore(stats);
  const current = getLevelByScore(score);
  const next = getNextLevelByScore(score);
  const toNext = pointsToNextLevel(score);
  return {
    score,
    level: current.key,
    levelLabel: current.label,
    levelLabelShort: current.short,
    nextLevel: next?.key ?? null,
    nextLevelLabel: next?.short ?? null,
    pointsToNextLevel: toNext,
    minScoreForCurrent: current.min,
    minScoreForNext: next?.min ?? null,
  };
}

const LEVEL_LABELS: Record<CuratorLevelKey, string> = {
  EXPLORER: 'اکسپلورر',
  NEW_CURATOR: 'تازه‌کار',
  ACTIVE_CURATOR: 'فعال',
  TRUSTED_CURATOR: 'معتمد',
  INFLUENTIAL_CURATOR: 'تاثیرگذار',
  ELITE_CURATOR: 'برتر',
  VIBE_LEGEND: 'افسانه',
};

export function getLevelConfig(level: CuratorLevelKey) {
  const configs: Record<
    CuratorLevelKey,
    { color: string; bgClass: string; icon: string; glowClass: string; short: string }
  > = {
    EXPLORER: {
      color: '#9CA3AF',
      bgClass: 'bg-gray-400/20 text-gray-700',
      icon: '🔍',
      glowClass: 'shadow-[0_0_12px_rgba(156,163,175,0.4)]',
      short: LEVEL_LABELS.EXPLORER,
    },
    NEW_CURATOR: {
      color: '#6366F1',
      bgClass: 'bg-indigo-500/15 text-indigo-700',
      icon: '✨',
      glowClass: 'shadow-[0_0_14px_rgba(99,102,241,0.4)]',
      short: LEVEL_LABELS.NEW_CURATOR,
    },
    ACTIVE_CURATOR: {
      color: '#7C3AED',
      bgClass: 'bg-violet-500/15 text-violet-700',
      icon: '🌟',
      glowClass: 'shadow-[0_0_16px_rgba(124,58,237,0.45)]',
      short: LEVEL_LABELS.ACTIVE_CURATOR,
    },
    TRUSTED_CURATOR: {
      color: '#9333EA',
      bgClass: 'bg-purple-600/15 text-purple-700',
      icon: '🎖️',
      glowClass: 'shadow-[0_0_18px_rgba(147,51,234,0.5)]',
      short: LEVEL_LABELS.TRUSTED_CURATOR,
    },
    INFLUENTIAL_CURATOR: {
      color: '#C026D3',
      bgClass: 'bg-fuchsia-600/15 text-fuchsia-700',
      icon: '🔥',
      glowClass: 'shadow-[0_0_20px_rgba(192,38,211,0.5)]',
      short: LEVEL_LABELS.INFLUENTIAL_CURATOR,
    },
    ELITE_CURATOR: {
      color: '#EAB308',
      bgClass: 'bg-amber-500/20 text-amber-800',
      icon: '👑',
      glowClass: 'shadow-[0_0_22px_rgba(234,179,8,0.5)]',
      short: LEVEL_LABELS.ELITE_CURATOR,
    },
    VIBE_LEGEND: {
      color: '#F59E0B',
      bgClass: 'bg-amber-400/25 text-amber-900',
      icon: '💫',
      glowClass: 'shadow-[0_0_24px_rgba(245,158,11,0.6)]',
      short: LEVEL_LABELS.VIBE_LEGEND,
    },
  };
  return configs[level] ?? configs.EXPLORER;
}

export { LEVEL_THRESHOLDS };
