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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">سطح {currentTier.short}</span>
        <span className="text-lg font-bold text-gray-900">{score} XP</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {nextLabel != null && toNext != null && toNext > 0 && (
        <p className="text-xs text-gray-500 mt-2">تا سطح بعدی: {toNext} XP</p>
      )}
      {nextTier === null && <p className="text-xs text-gray-500 mt-2">بالاترین سطح</p>}
    </div>
  );
}
