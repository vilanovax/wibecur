'use client';

import { useEffect, useState } from 'react';
import type { CuratorLevelKey } from '@/lib/curator';
import { getLevelConfig, getLevelByScore, getNextLevelByScore, pointsToNextLevel } from '@/lib/curator';

interface CuratorScoreBarProps {
  score: number;
  level: CuratorLevelKey | string;
  nextLevelLabel?: string | null;
  pointsToNext?: number | null;
  minScoreForNext?: number | null;
  animated?: boolean;
  className?: string;
}

function normalizeLevel(level: CuratorLevelKey | string): CuratorLevelKey {
  const s = String(level).toUpperCase().replace(/-/g, '_');
  const valid = ['EXPLORER', 'NEW_CURATOR', 'ACTIVE_CURATOR', 'TRUSTED_CURATOR', 'INFLUENTIAL_CURATOR', 'ELITE_CURATOR', 'VIBE_LEGEND'];
  return valid.includes(s) ? (s as CuratorLevelKey) : 'EXPLORER';
}

export default function CuratorScoreBar({
  score,
  level,
  nextLevelLabel = null,
  pointsToNext = null,
  minScoreForNext = null,
  animated = true,
  className = '',
}: CuratorScoreBarProps) {
  const key = normalizeLevel(level);
  const config = getLevelConfig(key);
  const next = getNextLevelByScore(score);
  const toNext = pointsToNext ?? pointsToNextLevel(score);
  const nextLabel = nextLevelLabel ?? next?.short ?? null;
  const [progress, setProgress] = useState(0);

  const currentTier = getLevelByScore(score);
  const nextTier = getNextLevelByScore(score);
  const rangeMin = currentTier.min;
  const rangeMax = nextTier?.min ?? rangeMin + 100;
  const progressPercent = nextTier
    ? Math.min(100, ((score - rangeMin) / (rangeMax - rangeMin)) * 100)
    : 100;

  useEffect(() => {
    if (!animated) {
      setProgress(progressPercent);
      return;
    }
    const t = setTimeout(() => setProgress(progressPercent), 100);
    return () => clearTimeout(t);
  }, [progressPercent, animated]);

  return (
    <div className={`rounded-2xl bg-white/15 backdrop-blur-sm p-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/90 text-sm font-medium">امتیاز کیوریتور</span>
        <span className="text-white font-bold text-sm">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-white/90 to-white/70 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {nextLabel != null && toNext != null && toNext > 0 && (
        <p className="text-white/80 text-xs mt-2">
          {toNext} امتیاز دیگر تا «{nextLabel}»
        </p>
      )}
      {nextLabel === null && toNext !== null && toNext <= 0 && (
        <p className="text-white/80 text-xs mt-2">بالاترین سطح</p>
      )}
    </div>
  );
}
