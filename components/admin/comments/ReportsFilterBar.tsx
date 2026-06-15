'use client';

import { Flag, CheckCircle, List, RefreshCw } from 'lucide-react';
import type { ReportsPulseSummary } from '@/lib/admin/comments-reports-intelligence';
import type { ReportsResolvedFilter } from '@/lib/admin/comments-reports-intelligence';

const FILTERS: {
  id: ReportsResolvedFilter;
  label: string;
  icon: typeof Flag;
  countKey: keyof ReportsPulseSummary;
}[] = [
  { id: 'open', label: 'باز', icon: Flag, countKey: 'open' },
  { id: 'resolved', label: 'حل‌شده', icon: CheckCircle, countKey: 'resolved' },
  { id: 'all', label: 'همه', icon: List, countKey: 'total' },
];

type Props = {
  currentFilter: ReportsResolvedFilter;
  pulse: ReportsPulseSummary;
  totalCount: number;
  onFilterChange: (filter: ReportsResolvedFilter) => void;
  onRefresh: () => void;
};

export default function ReportsFilterBar({
  currentFilter,
  pulse,
  totalCount,
  onFilterChange,
  onRefresh,
}: Props) {
  return (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 mb-4"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
          {totalCount.toLocaleString('fa-IR')} کامنت ریپورت‌شده
        </span>
        <button
          type="button"
          onClick={onRefresh}
          className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
          aria-label="بروزرسانی"
        >
          <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)]" />
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {FILTERS.map(({ id, label, icon: Icon, countKey }) => {
          const active = currentFilter === id;
          const count = pulse[countKey];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border-muted)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count > 0 && (
                <span
                  className={`min-w-[1.1rem] px-1 rounded-full text-[10px] font-bold tabular-nums ${
                    active ? 'bg-white/25 dark:bg-gray-800' : 'bg-rose-500 text-white'
                  }`}
                >
                  {count.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
