'use client';

import { Flame, Heart, Eye, Star } from 'lucide-react';
import type { CreatorStats } from './types';

interface ProfileStatsProps {
  creatorStats: CreatorStats;
}

function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

const STATS: {
  key: keyof CreatorStats;
  label: string;
  icon: typeof Flame;
  accentClass: string;
}[] = [
  { key: 'viralListsCount', label: 'وایرال', icon: Flame, accentClass: 'text-orange-500' },
  { key: 'totalLikesReceived', label: 'لایک', icon: Heart, accentClass: 'text-rose-500' },
  { key: 'profileViews', label: 'بازدید', icon: Eye, accentClass: 'text-blue-500' },
  { key: 'popularListsCount', label: 'لیست محبوب', icon: Star, accentClass: 'text-amber-500' },
];

export default function ProfileStats({ creatorStats }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STATS.map(({ key, label, icon: Icon, accentClass }) => (
        <div
          key={key}
          className="flex flex-col items-center py-3 rounded-xl bg-white border border-gray-100/80 hover:border-gray-200/80 hover:shadow-sm transition-all duration-200"
        >
          <Icon className={`w-5 h-5 mb-1 ${accentClass}`} />
          <span className="text-xl font-bold text-gray-900">{formatStat(Number(creatorStats[key] ?? 0))}</span>
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
}
