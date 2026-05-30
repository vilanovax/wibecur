'use client';

import { Bookmark, Flame, Eye, List } from 'lucide-react';
import type { CreatorStats } from './types';

interface ProfileStatsProps {
  creatorStats: CreatorStats;
  listsCreated?: number;
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('fa-IR');
}

/** Save-first — 2×2 grid با تعداد لیست‌های کاربر */
const STATS: {
  key: keyof CreatorStats | 'listsCreated';
  label: string;
  icon: typeof Bookmark;
  highlight?: boolean;
}[] = [
  { key: 'listsCreated', label: 'لیست من', icon: List, highlight: true },
  { key: 'popularListsCount', label: 'لیست محبوب', icon: Bookmark },
  { key: 'profileViews', label: 'بازدید', icon: Eye },
  { key: 'viralListsCount', label: 'ترند', icon: Flame },
];

export default function ProfileStats({ creatorStats, listsCreated = 0 }: ProfileStatsProps) {
  const getValue = (key: keyof CreatorStats | 'listsCreated') => {
    if (key === 'listsCreated') return listsCreated;
    return Number(creatorStats[key as keyof CreatorStats] ?? 0);
  };

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {STATS.map(({ key, label, icon: Icon, highlight }) => (
        <div
          key={key}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 px-1 text-center ${
            highlight ? 'bg-primary/8 ring-1 ring-primary/15' : 'bg-wibe-surface/90'
          }`}
        >
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md ${
              highlight ? 'bg-primary/12 text-primary' : 'bg-gray-100 text-wibe-secondary'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span
            className={`text-sm font-bold leading-none ${
              highlight ? 'text-primary' : 'text-foreground'
            }`}
          >
            {formatStat(getValue(key))}
          </span>
          <span className="max-w-full truncate text-[10px] leading-tight text-wibe-secondary">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
