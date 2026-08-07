'use client';

import { List, Filter, Zap } from 'lucide-react';

type Props = {
  totalWords: number;
  activeWords: number;
  totalFiltered: number;
};

export default function BadWordsStatsBar({
  totalWords,
  activeWords,
  totalFiltered,
}: Props) {
  const items = [
    { label: 'کل کلمات', value: totalWords, icon: List, accent: 'text-[var(--primary)]' },
    {
      label: 'کلمهٔ فعال (با فیلتر)',
      value: activeWords,
      icon: Zap,
      accent: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'کامنت فیلترشده',
      value: totalFiltered,
      icon: Filter,
      accent: 'text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-2 sm:gap-3 mb-4"
      dir="rtl"
    >
      {items.map(({ label, value, icon: Icon, accent }) => (
        <div
          key={label}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 sm:px-4 sm:py-3"
        >
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[var(--color-text-muted)] mb-1">
            <Icon className={`w-3.5 h-3.5 ${accent}`} />
            {label}
          </div>
          <p className="text-lg sm:text-xl font-bold tabular-nums text-[var(--color-text)]">
            {value.toLocaleString('fa-IR')}
          </p>
        </div>
      ))}
    </div>
  );
}
