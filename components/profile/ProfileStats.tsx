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

/** Save-first — موبایل: ۴ ستون | دسکتاپ: نوار افقی فشرده */
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
    <div className="grid grid-cols-4 gap-1.5 lg:flex lg:items-stretch lg:justify-between lg:gap-0 lg:rounded-lg lg:border lg:border-wibe/60 lg:bg-wibe-card/50 lg:py-1">
      {STATS.map(({ key, label, icon: Icon, highlight }, index) => (
        <div
          key={key}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center lg:flex-1 lg:flex-row lg:justify-center lg:gap-2.5 lg:rounded-none lg:px-4 lg:py-2.5 ${
            highlight ? 'bg-primary/8 ring-1 ring-primary/15 lg:bg-transparent lg:ring-0' : 'bg-wibe-surface/90 lg:bg-transparent'
          } ${index > 0 ? 'lg:border-s lg:border-wibe/50' : ''}`}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md lg:h-8 lg:w-8 ${
              highlight ? 'bg-primary/12 text-primary' : 'bg-gray-100 text-wibe-secondary'
            }`}
          >
            <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </div>
          <div className="lg:text-right">
            <span
              className={`block text-sm font-bold leading-none lg:text-base ${
                highlight ? 'text-primary' : 'text-foreground'
              }`}
            >
              {formatStat(getValue(key))}
            </span>
            <span className="mt-0.5 block max-w-full truncate text-[10px] leading-tight text-wibe-secondary lg:text-xs">
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
