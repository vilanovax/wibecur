'use client';

import { Flag, CheckCircle, List } from 'lucide-react';
import type { ReportsPulseSummary } from '@/lib/admin/comments-reports-intelligence';
import type { ReportsResolvedFilter } from '@/lib/admin/comments-reports-intelligence';

const cards: {
  key: ReportsResolvedFilter;
  label: string;
  icon: typeof Flag;
  bg: string;
  countKey: keyof ReportsPulseSummary;
}[] = [
  {
    key: 'open',
    label: 'باز (حل‌نشده)',
    icon: Flag,
    bg: 'from-rose-500/10 to-rose-600/5 border-rose-200/50 dark:border-rose-800/60',
    countKey: 'open',
  },
  {
    key: 'resolved',
    label: 'حل‌شده',
    icon: CheckCircle,
    bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/60',
    countKey: 'resolved',
  },
  {
    key: 'all',
    label: 'همه ریپورت‌ها',
    icon: List,
    bg: 'from-slate-500/10 to-slate-600/5 border-slate-200/50 dark:border-gray-700',
    countKey: 'total',
  },
];

type Props = {
  data: ReportsPulseSummary;
  active: ReportsResolvedFilter;
  onFilterClick?: (filter: ReportsResolvedFilter) => void;
};

export default function ReportsPulseSummary({
  data,
  active,
  onFilterClick,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" dir="rtl">
      {cards.map(({ key, label, icon: Icon, bg, countKey }) => {
        const isActive = active === key;
        const clickable = !!onFilterClick;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onFilterClick?.(key)}
            disabled={!clickable}
            className={`rounded-2xl border bg-gradient-to-br ${bg} p-4 shadow-sm text-right transition-all ${
              isActive ? 'ring-2 ring-[var(--primary)] ring-offset-2' : ''
            } ${
              clickable
                ? 'hover:shadow-md hover:scale-[1.01] cursor-pointer'
                : 'cursor-default'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-[var(--color-text)]" />
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
                {label}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
              {data[countKey].toLocaleString('fa-IR')}
            </p>
          </button>
        );
      })}
    </div>
  );
}
