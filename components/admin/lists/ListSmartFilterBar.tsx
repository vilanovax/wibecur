'use client';

import { useState } from 'react';
import { Search, LayoutGrid, Table2, SlidersHorizontal, X, Images } from 'lucide-react';
import type { ListCategoryOption } from '@/lib/admin/lists-intelligence';
import type { ListAdminViewMode } from './ListCoversGallery';

export type ListFilterKind =
  | 'all'
  | 'rising'
  | 'trending_top'
  | 'low_engagement'
  | 'suspicious'
  | 'needs_review'
  | 'zero_save'
  | 'featured';

const FILTER_LABELS: Record<ListFilterKind, string> = {
  all: 'همه',
  rising: 'رشد',
  trending_top: '۱۰ برتر',
  low_engagement: 'کم‌تعامل',
  suspicious: 'ریسک',
  needs_review: 'نیازمند بررسی',
  zero_save: 'بدون ذخیره',
  featured: 'Featured',
};

const secondaryPills: { value: ListFilterKind; label: string }[] = [
  { value: 'trending_top', label: '۱۰ برتر' },
  { value: 'needs_review', label: 'نیازمند بررسی' },
  { value: 'zero_save', label: 'بدون ذخیره' },
];

interface ListSmartFilterBarProps {
  value: ListFilterKind;
  onChange: (value: ListFilterKind) => void;
  counts: Record<ListFilterKind, number>;
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: ListAdminViewMode;
  onViewModeChange: (mode: ListAdminViewMode) => void;
  resultCount: number;
  totalCount?: number;
  categories: ListCategoryOption[];
  categoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  /** فشرده برای نوار sticky */
  compact?: boolean;
}

export default function ListSmartFilterBar({
  value,
  onChange,
  counts,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  resultCount,
  categories,
  categoryId,
  onCategoryChange,
  onClearFilters,
  hasActiveFilters,
  compact = false,
}: ListSmartFilterBarProps) {
  const [showSecondary, setShowSecondary] = useState(false);
  const isSecondaryActive = secondaryPills.some((p) => p.value === value);

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-3'}`} dir="rtl">
      <div className={`flex ${compact ? 'flex-row items-center' : 'flex-col sm:flex-row'} gap-2`}>
        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجو…"
            className={`w-full pr-10 pl-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${
              compact ? 'py-1.5' : 'py-2'
            }`}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm max-w-[180px] truncate ${compact ? 'py-1.5' : 'py-2'}`}
            title="دسته‌بندی"
          >
            <option value="all">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}
                {c.name} ({c.listCount.toLocaleString('fa-IR')})
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className={`px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm ${compact ? 'py-1.5' : 'py-2'}`}
            title="مرتب‌سازی"
          >
            <option value="score_desc">امتیاز ↓</option>
            <option value="score_asc">امتیاز ↑</option>
            <option value="items_desc">آیتم ↓</option>
            <option value="items_asc">آیتم ↑</option>
            <option value="saves_desc">ذخیره ↓</option>
            <option value="saves_asc">ذخیره ↑</option>
            <option value="24h_desc">۲۴س ↓</option>
            <option value="date_desc">جدیدترین</option>
            <option value="date_asc">قدیمی‌ترین</option>
          </select>

          <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange('covers')}
              title="نمایش کاور ۱ و ۲"
              className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium ${
                viewMode === 'covers'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
              }`}
            >
              <Images className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">کاورها</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="گرید"
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              title="جدول"
              className={`p-1.5 ${viewMode === 'table' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}
            >
              <Table2 className="w-4 h-4" />
            </button>
          </div>

          {!compact && (
            <button
              type="button"
              onClick={() => setShowSecondary((s) => !s)}
              className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border text-sm ${
                showSecondary || isSecondaryActive
                  ? 'border-[var(--primary)]/40 bg-[var(--primary)]/5 text-[var(--primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">بیشتر</span>
            </button>
          )}

          {value !== 'all' && (
            <span className="text-xs px-2 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] font-medium whitespace-nowrap">
              {FILTER_LABELS[value]}
            </span>
          )}

          <span className="text-xs text-[var(--color-text-muted)] tabular-nums whitespace-nowrap mr-auto sm:mr-0">
            {resultCount.toLocaleString('fa-IR')} نتیجه
          </span>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center gap-2 min-h-[24px]">
          {(showSecondary || isSecondaryActive) &&
            secondaryPills.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange(value === p.value ? 'all' : p.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  value === p.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border-muted)] border border-[var(--color-border-muted)]'
                }`}
              >
                {p.label}
                <span className="mr-1 opacity-75 tabular-nums">({counts[p.value].toLocaleString('fa-IR')})</span>
              </button>
            ))}

          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline mr-auto"
            >
              <X className="w-3 h-3" />
              پاک کردن
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { secondaryPills as LIST_FILTER_PILLS, FILTER_LABELS };
