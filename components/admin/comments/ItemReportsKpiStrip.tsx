'use client';

import { Flag, CheckCircle, List } from 'lucide-react';
type Props = {
  open: number;
  resolved: number;
  total: number;
  active: 'all' | 'open' | 'resolved';
  onFilter: (resolved: string | undefined) => void;
};

export default function ItemReportsKpiStrip({
  open,
  resolved,
  total,
  active,
  onFilter,
}: Props) {
  const cards = [
    {
      key: 'open' as const,
      label: 'باز (حل‌نشده)',
      value: open,
      icon: Flag,
      accent: 'from-rose-500/10 to-rose-600/5 border-rose-200/60',
      resolvedParam: 'false' as const,
    },
    {
      key: 'resolved' as const,
      label: 'حل‌شده',
      value: resolved,
      icon: CheckCircle,
      accent: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/60',
      resolvedParam: 'true' as const,
    },
    {
      key: 'all' as const,
      label: 'همه گزارش‌ها',
      value: total,
      icon: List,
      accent: 'from-slate-500/10 to-slate-600/5 border-slate-200/60',
      resolvedParam: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6" dir="rtl">
      {cards.map(({ key, label, value, icon: Icon, accent, resolvedParam }) => {
        const isActive =
          (key === 'open' && active === 'open') ||
          (key === 'resolved' && active === 'resolved') ||
          (key === 'all' && active === 'all');
        return (
          <button
            key={key}
            type="button"
            onClick={() => onFilter(resolvedParam)}
            className={`rounded-2xl border bg-gradient-to-br ${accent} p-4 text-right transition-all hover:shadow-md ${
              isActive ? 'ring-2 ring-[var(--primary)] ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-2">
              <Icon className="w-4 h-4" />
              {label}
            </div>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
              {value.toLocaleString('fa-IR')}
            </p>
          </button>
        );
      })}
    </div>
  );
}
