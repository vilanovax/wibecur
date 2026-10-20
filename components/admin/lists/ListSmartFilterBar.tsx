'use client';

import { useState } from 'react';
import { Search, LayoutGrid, Table2, SlidersHorizontal, X, Images, Sparkles } from 'lucide-react';
import type { ListCategoryOption } from '@/lib/admin/lists-types';
import type { ListAdminViewMode } from './ListCoversGallery';

export type ListFilterKind =
  | 'all'
  | 'rising'
  | 'trending_top'
  | 'low_engagement'
  | 'suspicious'
  | 'needs_review'
  | 'zero_save'
  | 'featured'
  | 'no_cover';

const FILTER_LABELS: Record<ListFilterKind, string> = {
  all: 'همه',
  rising: 'رشد',
  trending_top: '۱۰ برتر',
  low_engagement: 'کم‌تعامل',
  suspicious: 'ریسک',
  needs_review: 'نیازمند بررسی',
  zero_save: 'بدون ذخیره',
  featured: 'Featured',
  no_cover: 'بدون کاور',
};

const secondaryPills: { value: ListFilterKind; label: string }[] = [
  { value: 'trending_top', label: '۱۰ برتر' },
  { value: 'needs_review', label: 'نیازمند بررسی' },
  { value: 'zero_save', label: 'بدون ذخیره' },
  { value: 'no_cover', label: 'بدون کاور' },
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
  /** باز کردن ممیزی تصاویر استوریج (فقط در نمای کاورها) */
  onOpenCoverAudit?: () => void;
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
  onOpenCoverAudit,
  compact = false,
}: ListSmartFilterBarProps) {
  const [showSecondary, setShowSecondary] = useState(false);
  const isSecondaryActive = secondaryPills.some((p) => p.value === value);

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-3'}`} dir="rtl">
      <div className={`flex ${compact ? 'flex-row items-center' : 'flex-col sm:flex-row'} gap-2`}>
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجو در عنوان، دسته یا نویسنده…"
            className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pe-10 ps-10 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute start-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
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
            className="min-h-11 max-w-xs truncate rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
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
            className="min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            title="مرتب‌سازی"
            aria-label="مرتب‌سازی"
          >
            <option value="score_desc">بیشترین امتیاز</option>
            <option value="score_asc">کمترین امتیاز</option>
            <option value="items_desc">بیشترین آیتم</option>
            <option value="items_asc">کمترین آیتم</option>
            <option value="saves_desc">بیشترین ذخیره</option>
            <option value="saves_asc">کمترین ذخیره</option>
            <option value="24h_desc">بیشترین ۲۴ ساعت</option>
            <option value="24h_asc">کمترین ۲۴ ساعت</option>
            <option value="date_desc">جدیدترین</option>
            <option value="date_asc">قدیمی‌ترین</option>
          </select>

          <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange('covers')}
              title="نمایش کاور ۱ و ۲"
              className={`inline-flex min-h-11 items-center gap-1 px-3 text-xs font-medium ${
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
              className={`inline-flex size-11 items-center justify-center ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              title="جدول"
              className={`inline-flex size-11 items-center justify-center ${viewMode === 'table' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}
            >
              <Table2 className="w-4 h-4" />
            </button>
          </div>

          {viewMode === 'covers' && onOpenCoverAudit ? (
            <button
              type="button"
              onClick={onOpenCoverAudit}
              title="بررسی حجم و بهینه‌سازی کاورها در ParsPack"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-violet-300 bg-violet-50 text-violet-800 text-xs font-medium hover:bg-violet-100 transition-colors"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">ممیزی استوریج</span>
            </button>
          ) : null}

          {!compact && (
            <button
              type="button"
              onClick={() => setShowSecondary((s) => !s)}
              className={`inline-flex min-h-11 items-center gap-1 rounded-xl border px-3 text-sm ${
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

          <span className="whitespace-nowrap text-xs tabular-nums text-[var(--color-text-muted)] ms-auto">
            {resultCount.toLocaleString('fa-IR')} نتیجه
          </span>
        </div>
      </div>

      {!compact && (showSecondary || isSecondaryActive || (hasActiveFilters && onClearFilters)) && (
        <div className="flex flex-wrap items-center gap-2">
          {(showSecondary || isSecondaryActive) &&
            secondaryPills.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange(value === p.value ? 'all' : p.value)}
                className={`inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium transition-colors ${
                  value === p.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border-muted)] border border-[var(--color-border-muted)]'
                }`}
              >
                {p.label}
                <span className="ms-1 tabular-nums opacity-75">({counts[p.value].toLocaleString('fa-IR')})</span>
              </button>
            ))}

          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="ms-auto inline-flex min-h-11 items-center gap-1 text-xs text-[var(--primary)] hover:underline"
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
