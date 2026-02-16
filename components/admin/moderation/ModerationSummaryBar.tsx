'use client';

import React from 'react';

export interface ModerationSummaryBarProps {
  openCount: number;
  inReviewCount: number;
  highSeverityCount: number;
  resolvedTodayCount: number;
  onFilterOpen?: () => void;
  onFilterInReview?: () => void;
  onFilterHighSeverity?: () => void;
  onFilterResolvedToday?: () => void;
}

export default function ModerationSummaryBar({
  openCount,
  inReviewCount,
  highSeverityCount,
  resolvedTodayCount,
  onFilterOpen,
  onFilterInReview,
  onFilterHighSeverity,
  onFilterResolvedToday,
}: ModerationSummaryBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" dir="rtl">
      <button
        type="button"
        onClick={onFilterOpen}
        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-right shadow-sm hover:ring-2 hover:ring-amber-400 transition-all duration-200"
      >
        <p className="text-xs text-gray-500 mb-0.5">Open</p>
        <p className="text-2xl font-semibold text-amber-600">{openCount}</p>
      </button>
      <button
        type="button"
        onClick={onFilterInReview}
        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-right shadow-sm hover:ring-2 hover:ring-blue-400 transition-all duration-200"
      >
        <p className="text-xs text-gray-500 mb-0.5">In Review</p>
        <p className="text-2xl font-semibold text-blue-600">{inReviewCount}</p>
      </button>
      <button
        type="button"
        onClick={onFilterHighSeverity}
        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-right shadow-sm hover:ring-2 hover:ring-red-400 transition-all duration-200"
      >
        <p className="text-xs text-gray-500 mb-0.5">High Severity</p>
        <p className="text-2xl font-semibold text-red-600">{highSeverityCount}</p>
      </button>
      <button
        type="button"
        onClick={onFilterResolvedToday}
        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-right shadow-sm hover:ring-2 hover:ring-emerald-400 transition-all duration-200"
      >
        <p className="text-xs text-gray-500 mb-0.5">Resolved Today</p>
        <p className="text-2xl font-semibold text-emerald-600">{resolvedTodayCount}</p>
      </button>
    </div>
  );
}
