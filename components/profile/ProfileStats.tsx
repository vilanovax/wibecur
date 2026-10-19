'use client';

import { Bookmark, Eye, Sparkles } from 'lucide-react';
import type { ProfileTabId } from '@/components/profile/ProfileTabs';
import type { CreatorStats } from './types';

interface ProfileStatsProps {
  creatorStats: CreatorStats;
  onNavigate?: (tab: ProfileTabId) => void;
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('fa-IR');
}

const STATS: {
  key: keyof CreatorStats;
  label: string;
  hint: string;
  icon: typeof Eye;
  tab?: ProfileTabId;
}[] = [
  {
    key: 'profileViews',
    label: 'بازدید',
    hint: 'مجموع بازدید لیست‌های شما',
    icon: Eye,
  },
  {
    key: 'totalSavesReceived',
    label: 'ذخیره دریافتی',
    hint: 'دفعاتی که لیست‌هایتان ذخیره شده',
    icon: Bookmark,
  },
  {
    key: 'popularListsCount',
    label: 'لیست محبوب',
    hint: 'لیست‌هایی با ۱۰+ ذخیره',
    icon: Sparkles,
    tab: 'my-lists',
  },
];

export default function ProfileStats({ creatorStats, onNavigate }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 lg:flex lg:items-stretch lg:justify-between lg:gap-0 lg:rounded-lg lg:border lg:border-wibe/60 lg:bg-wibe-card/50 lg:py-1">
      {STATS.map(({ key, label, hint, icon: Icon, tab }, index) => {
        const value = Number(creatorStats[key] ?? 0);
        const content = (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-wibe-surface text-wibe-secondary lg:h-8 lg:w-8">
              <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </div>
            <div className="min-w-0 lg:text-right">
              <span className="block text-sm font-bold leading-none text-foreground lg:text-base">
                {formatStat(value)}
              </span>
              <span className="mt-0.5 block truncate wibe-caption leading-tight text-wibe-secondary lg:text-xs">
                {label}
              </span>
            </div>
          </>
        );

        const className = `flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center transition-colors lg:flex-1 lg:flex-row lg:justify-center lg:gap-2.5 lg:rounded-none lg:px-4 lg:py-2.5 ${
          index > 0 ? 'lg:border-s lg:border-wibe/50' : ''
        } ${
          onNavigate
            ? 'cursor-pointer bg-wibe-surface/90 hover:bg-wibe-surface active:bg-primary/5'
            : 'bg-wibe-surface/90'
        }`;

        if (onNavigate && tab) {
          return (
            <button
              key={key}
              type="button"
              title={hint}
              aria-label={`${label}: ${formatStat(value)}. ${hint}`}
              onClick={() => onNavigate(tab)}
              className={className}
            >
              {content}
            </button>
          );
        }

        return (
          <div key={key} title={hint} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
