'use client';

import { Clock, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import type { CommentsPulseSummary } from '@/lib/admin/comments-pulse';
import type { CommentsPulseFilterKey } from '@/lib/admin/comments-pulse';

const cards: {
  key: CommentsPulseFilterKey;
  label: string;
  icon: typeof Clock;
  bg: string;
}[] = [
  {
    key: 'pending',
    label: 'در انتظار بررسی',
    icon: Clock,
    bg: 'from-amber-500/10 to-amber-600/5 border-amber-200/50',
  },
  {
    key: 'flagged',
    label: 'نیاز به بررسی',
    icon: AlertTriangle,
    bg: 'from-orange-500/10 to-orange-600/5 border-orange-200/50',
  },
  {
    key: 'reported',
    label: 'ریپورت‌شده',
    icon: Flag,
    bg: 'from-rose-500/10 to-rose-600/5 border-rose-200/50',
  },
  {
    key: 'approved',
    label: 'تایید شده',
    icon: CheckCircle,
    bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50',
  },
];

interface CommentsPulseSummaryProps {
  data: CommentsPulseSummary;
  activeFilter?: string;
  onFilterClick?: (key: CommentsPulseFilterKey) => void;
}

export default function CommentsPulseSummary({
  data,
  activeFilter,
  onFilterClick,
}: CommentsPulseSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" dir="rtl">
      {cards.map(({ key, label, icon: Icon, bg }) => {
        const value = data[key];
        const filterId = key === 'pending' ? 'pending' : key;
        const isActive = activeFilter === filterId;
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
            <p className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
              {value.toLocaleString('fa-IR')}
            </p>
            {clickable && (
              <p className="text-xs text-[var(--color-text-subtle)] mt-1">کلیک برای فیلتر</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
