'use client';

import type { CategoryFilterKind } from '@/lib/admin/categories-types';

const tabs: { value: CategoryFilterKind; label: string; color: string; title?: string }[] = [
  { value: 'all', label: 'همه', color: 'bg-[var(--color-surface)] text-[var(--color-text)]' },
  {
    value: 'healthy',
    label: 'سالم',
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200',
  },
  {
    value: 'needs_boost',
    label: 'نیازمند Boost',
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
    title: 'دسته‌های فعال با وزن الگوریتمی کمتر از ۱.۲×',
  },
  {
    value: 'declining',
    label: 'در حال افت',
    color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
  },
  {
    value: 'inactive',
    label: 'غیرفعال',
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  },
];

interface CategoryFilterTabsProps {
  value: CategoryFilterKind;
  onChange: (value: CategoryFilterKind) => void;
  counts?: Partial<Record<CategoryFilterKind, number>>;
}

export default function CategoryFilterTabs({ value, onChange, counts }: CategoryFilterTabsProps) {
  return (
    <div
      className="inline-flex flex-wrap rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] p-1 gap-0.5"
      dir="rtl"
      role="tablist"
    >
      {tabs.map((tab) => {
        const count = counts?.[tab.value];
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={value === tab.value}
            onClick={() => onChange(tab.value)}
            title={tab.title}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              value === tab.value
                ? tab.value === 'all'
                  ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text)] ring-1 ring-[var(--color-border)]'
                  : tab.color + ' shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]/80'
            }`}
          >
            {tab.label}
            {count !== undefined && (
              <span className="mr-1.5 text-xs opacity-75 tabular-nums">
                ({count.toLocaleString('fa-IR')})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
