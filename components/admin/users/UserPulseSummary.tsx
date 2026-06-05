'use client';

import { Users, TrendingUp, Brain, AlertTriangle } from 'lucide-react';
import type { UserPulseSummary as UserPulseSummaryType } from '@/lib/admin/users-types';
import type { UserPulseFilterKey } from '@/lib/admin/user-filter-utils';

const cards: {
  key: UserPulseFilterKey;
  label: string;
  icon: typeof Users;
  bg: string;
}[] = [
  {
    key: 'activeUsers7d',
    label: 'کاربران فعال (۷ روز)',
    icon: Users,
    bg: 'from-blue-500/10 to-blue-600/5 border-blue-200/50',
  },
  {
    key: 'highGrowthCount',
    label: 'در حال رشد',
    icon: TrendingUp,
    bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50',
  },
  {
    key: 'curatorCandidatesCount',
    label: 'نامزد کیوریتور',
    icon: Brain,
    bg: 'from-violet-500/10 to-violet-600/5 border-violet-200/50',
  },
  {
    key: 'suspiciousCount',
    label: 'مشکوک',
    icon: AlertTriangle,
    bg: 'from-amber-500/10 to-amber-600/5 border-amber-200/50',
  },
];

interface UserPulseSummaryProps {
  data: UserPulseSummaryType;
  onFilterClick?: (key: UserPulseFilterKey) => void;
}

export default function UserPulseSummary({ data, onFilterClick }: UserPulseSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(({ key, label, icon: Icon, bg }) => {
        const value = data[key] as number;
        const clickable = !!onFilterClick;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onFilterClick?.(key)}
            disabled={!clickable}
            className={`rounded-2xl border bg-gradient-to-br ${bg} p-4 shadow-sm text-right transition-all ${
              clickable
                ? 'hover:shadow-md hover:scale-[1.01] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
                : 'cursor-default'
            }`}
            title={clickable ? `فیلتر: ${label}` : undefined}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-white/60">
                <Icon className="w-4 h-4 text-[var(--color-text)]" />
              </span>
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
                {label}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-text)] min-h-[2rem]">
              {Number.isFinite(value) ? value.toLocaleString('fa-IR') : '۰'}
            </p>
            {key === 'activeUsers7d' && data.activeUsers7dDelta != null && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {data.activeUsers7dDelta >= 0 ? '+' : ''}
                {data.activeUsers7dDelta.toLocaleString('fa-IR')}٪ نسبت به دوره قبل
              </p>
            )}
            {clickable && (
              <p className="text-[11px] text-[var(--primary)] mt-2 opacity-80">
                کلیک برای فیلتر
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
