'use client';

import { Bookmark, Flame, Eye } from 'lucide-react';
import type { CreatorStats } from './types';

interface ProfileStatsProps {
  creatorStats: CreatorStats;
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('fa-IR');
}

/** Save-first — ذخیره و محبوبیت قبل از لایک */
const STATS: {
  key: keyof CreatorStats;
  label: string;
  icon: typeof Bookmark;
  highlight?: boolean;
}[] = [
  { key: 'popularListsCount', label: 'لیست محبوب', icon: Bookmark, highlight: true },
  { key: 'viralListsCount', label: 'ترند', icon: Flame },
  { key: 'profileViews', label: 'بازدید', icon: Eye },
  { key: 'totalItemsCurated', label: 'آیتم کیوریت', icon: Bookmark },
];

export default function ProfileStats({ creatorStats }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STATS.map(({ key, label, icon: Icon, highlight }) => (
        <div
          key={key}
          className="flex flex-col items-center py-3 rounded-lg bg-wibe-card border border-wibe"
        >
          <Icon className={`w-5 h-5 mb-1 ${highlight ? 'text-primary' : 'text-wibe-secondary'}`} />
          <span className={`text-h3 font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
            {formatStat(Number(creatorStats[key] ?? 0))}
          </span>
          <span className="wibe-caption text-wibe-secondary">{label}</span>
        </div>
      ))}
    </div>
  );
}
