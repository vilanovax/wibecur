'use client';

import { getLevelByScore, getNextLevelByScore, pointsToNextLevel } from '@/lib/curator';
import type { ProfileUser } from './types';

interface ProfileLevelProps {
  user: ProfileUser;
  compact?: boolean;
}

export default function ProfileLevel({ user, compact = false }: ProfileLevelProps) {
  const score = user.curatorScore ?? 0;
  const currentTier = getLevelByScore(score);
  const nextTier = getNextLevelByScore(score);
  const toNext = user.curatorPointsToNext ?? pointsToNextLevel(score);
  const nextLabel = user.curatorNextLevelLabel ?? nextTier?.short ?? null;
  const rangeMin = currentTier.min;
  const rangeMax = nextTier?.min ?? rangeMin + 100;
  const progressPercent = nextTier
    ? Math.min(100, ((score - rangeMin) / (rangeMax - rangeMin)) * 100)
    : 100;

  return (
    <div className={`rounded-lg border border-wibe bg-wibe-card shadow-sm ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex justify-between items-center gap-2 mb-2">
        <div className="min-w-0">
          <span className="wibe-caption text-wibe-secondary">سطح کیوریتور</span>
          <p className="wibe-small font-semibold text-foreground">{currentTier.short}</p>
        </div>
        <span className="wibe-h3 font-bold text-primary shrink-0">
          {score.toLocaleString('fa-IR')} XP
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {nextLabel != null && toNext != null && toNext > 0 ? (
        <p className="wibe-caption text-wibe-secondary mt-1.5">
          {toNext.toLocaleString('fa-IR')} XP تا {nextLabel}
        </p>
      ) : nextTier === null ? (
        <p className="wibe-caption text-wibe-secondary mt-1.5">بالاترین سطح 🎉</p>
      ) : null}
    </div>
  );
}
