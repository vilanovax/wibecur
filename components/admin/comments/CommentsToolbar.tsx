'use client';

import { useCallback, useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import {
  COMMENT_SORT_OPTIONS,
  type CommentSortKind,
} from '@/lib/admin/comments-intelligence';
import type { CommentFilterKind } from '@/lib/admin/comments-filter-utils';

const MORE_FILTERS: { id: CommentFilterKind; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'filtered', label: 'کلمات بد' },
  { id: 'rejected', label: 'رد شده' },
];

interface CommentsToolbarProps {
  currentFilter: string;
  currentSearch: string;
  currentSort: CommentSortKind;
  totalCount: number;
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: CommentSortKind) => void;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
}

export default function CommentsToolbar({
  currentFilter,
  currentSearch,
  currentSort,
  totalCount,
  onFilterChange,
  onSortChange,
  onSearchChange,
  onRefresh,
}: CommentsToolbarProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const t = setTimeout(() => onSearchChange(value), 400);
      setSearchTimeout(t);
    },
    [onSearchChange, searchTimeout]
  );

  const isSecondaryFilter = ['all', 'filtered', 'rejected'].includes(currentFilter);

  return (
    <div
      className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] p-4 mb-4"
      dir="rtl"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <form
          className="flex-1 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchChange(searchInput);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="جستجو در متن کامنت…"
              className="w-full pr-10 pl-4 py-2 border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm bg-[var(--color-bg)]"
            />
          </div>
        </form>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className="whitespace-nowrap">
              {isSecondaryFilter ? 'فیلتر' : 'فیلتر دیگر'}
            </span>
            <select
              value={isSecondaryFilter ? currentFilter : 'all'}
              onChange={(e) => onFilterChange(e.target.value)}
              className="py-2 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
            >
              {MORE_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className="whitespace-nowrap">مرتب‌سازی</span>
            <select
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value as CommentSortKind)}
              className="py-2 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
            >
              {COMMENT_SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <span className="text-sm text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">
            {totalCount.toLocaleString('fa-IR')} نتیجه
          </span>
          <button
            type="button"
            onClick={() => onRefresh()}
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
            title="بروزرسانی"
            aria-label="بروزرسانی"
          >
            <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
        </div>
      </div>
    </div>
  );
}
