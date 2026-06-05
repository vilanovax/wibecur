'use client';

import { Search, LayoutGrid, Table2, GripVertical, ArrowUpDown } from 'lucide-react';
import type { CategoryViewMode, CategorySortKey } from '@/lib/admin/categories-types';

export type { CategoryViewMode, CategorySortKey };

const SORT_OPTIONS: { value: CategorySortKey; label: string }[] = [
  { value: 'order', label: 'ترتیب نمایش' },
  { value: 'name', label: 'نام' },
  { value: 'listCount', label: 'تعداد لیست' },
  { value: 'engagement', label: 'تعامل' },
  { value: 'growth', label: 'رشد ذخیره' },
  { value: 'avgSaves', label: 'میانگین ذخیره' },
  { value: 'weight', label: 'وزن الگوریتم' },
];

interface CategoryListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortKey: CategorySortKey;
  onSortChange: (key: CategorySortKey) => void;
  viewMode: CategoryViewMode;
  onViewModeChange: (mode: CategoryViewMode) => void;
  resultCount: number;
  totalCount: number;
}

export default function CategoryListToolbar({
  search,
  onSearchChange,
  sortKey,
  onSortChange,
  viewMode,
  onViewModeChange,
  resultCount,
  totalCount,
}: CategoryListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" dir="rtl">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجو در نام یا slug..."
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 border-[var(--primary)]/20 bg-[var(--color-surface)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
          <select
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as CategorySortKey)}
            disabled={viewMode === 'reorder'}
            className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] disabled:opacity-50"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div
          className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5"
          role="group"
          aria-label="نوع نمایش"
        >
          {(
            [
              { mode: 'grid' as const, icon: LayoutGrid, label: 'کارت' },
              { mode: 'table' as const, icon: Table2, label: 'جدول' },
              { mode: 'reorder' as const, icon: GripVertical, label: 'ترتیب' },
            ] as const
          ).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              type="button"
              title={label}
              onClick={() => onViewModeChange(mode)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-[var(--color-surface)] text-[var(--primary)] shadow-sm ring-1 ring-[var(--color-border)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <span className="text-xs text-[var(--color-text-muted)] tabular-nums px-1">
          {resultCount.toLocaleString('fa-IR')} از {totalCount.toLocaleString('fa-IR')}
        </span>
      </div>
    </div>
  );
}
