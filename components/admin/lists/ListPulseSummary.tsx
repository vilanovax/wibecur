'use client';

import Link from 'next/link';
import { List, TrendingUp, AlertCircle, ShieldAlert, Star } from 'lucide-react';
import type { ListPulse } from '@/lib/admin/lists-intelligence';
import type { ListFilterKind } from '@/components/admin/lists/ListSmartFilterBar';

type PulseKey = 'totalLists' | 'risingLists' | 'lowEngagementLists' | 'flaggedLists' | 'featuredLists';

const cells: Array<{
  key: PulseKey;
  filter: ListFilterKind | 'all';
  label: string;
  icon: typeof List;
  accent: string;
  manageHref?: string;
}> = [
  { key: 'totalLists', filter: 'all', label: 'کل', icon: List, accent: 'text-[var(--primary)]' },
  { key: 'risingLists', filter: 'rising', label: 'رشد', icon: TrendingUp, accent: 'text-emerald-600' },
  { key: 'lowEngagementLists', filter: 'low_engagement', label: 'کم‌تعامل', icon: AlertCircle, accent: 'text-amber-600' },
  { key: 'flaggedLists', filter: 'suspicious', label: 'ریسک', icon: ShieldAlert, accent: 'text-red-600' },
  { key: 'featuredLists', filter: 'featured', label: 'Featured', icon: Star, accent: 'text-amber-500', manageHref: '/admin/custom/featured' },
];

interface ListPulseSummaryProps {
  pulse: ListPulse;
  activeFilter?: ListFilterKind;
  onFilterClick?: (filter: ListFilterKind) => void;
  compact?: boolean;
}

export default function ListPulseSummary({
  pulse,
  activeFilter,
  onFilterClick,
}: ListPulseSummaryProps) {
  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex flex-wrap gap-2">
        {cells.map(({ key, filter, label, icon: Icon, accent, manageHref }) => {
          const isActive = filter === 'all' ? activeFilter === 'all' : activeFilter === filter;
          const count = pulse[key];
          const Tag = onFilterClick ? 'button' : 'div';

          return (
            <Tag
              key={key}
              type={onFilterClick ? 'button' : undefined}
              onClick={onFilterClick ? () => onFilterClick(filter === 'all' ? 'all' : filter) : undefined}
              className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border min-w-[7rem] transition-all ${
                isActive
                  ? 'border-[var(--primary)] bg-[var(--primary)]/8 shadow-sm ring-1 ring-[var(--primary)]/25'
                  : 'border-[var(--color-border-muted)] bg-[var(--color-bg)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]'
              } ${onFilterClick ? 'cursor-pointer' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--primary)]' : accent}`} />
              <div className="text-right min-w-0">
                <p className="text-[10px] font-medium text-[var(--color-text-muted)] leading-none">{label}</p>
                <p className="text-base font-bold tabular-nums text-[var(--color-text)] leading-tight mt-0.5">
                  {count.toLocaleString('fa-IR')}
                </p>
              </div>
              {manageHref && count > 0 && (
                <Link
                  href={manageHref}
                  className="absolute -bottom-2 left-1 text-[9px] text-[var(--primary)] opacity-0 group-hover:opacity-100 hover:underline bg-[var(--color-surface)] px-1 rounded transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  اسلات
                </Link>
              )}
            </Tag>
          );
        })}
      </div>
      {pulse.insightLine && (
        <p className="text-xs text-[var(--color-text-muted)] px-0.5 truncate" title={pulse.insightLine}>
          {pulse.insightLine}
        </p>
      )}
    </div>
  );
}
