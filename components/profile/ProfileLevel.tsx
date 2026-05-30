'use client';

import { getLevelByScore, getNextLevelByScore, pointsToNextLevel } from '@/lib/curator';
import type { ProfileUser } from './types';

interface ProfileLevelProps {
  user: ProfileUser;
}

export default function ProfileLevel({ user }: ProfileLevelProps) {
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
    <div className="rounded-lg border border-wibe bg-wibe-card p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="wibe-small font-medium text-wibe-secondary">سطح {currentTier.short}</span>
        <span className="wibe-h3 font-bold text-foreground">{score.toLocaleString('fa-IR')} XP</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {nextLabel != null && toNext != null && toNext > 0 && (
        <p className="wibe-caption text-wibe-secondary mt-2">تا سطح بعدی: {toNext.toLocaleString('fa-IR')} XP</p>
      )}
      {nextTier === null && <p className="wibe-caption text-wibe-secondary mt-2">بالاترین سطح</p>}
    </div>
  );
}
