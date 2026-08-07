'use client';

import { useCallback, useState, useEffect } from 'react';
import {
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  Flag,
  XCircle,
  Search,
  RefreshCw,
} from 'lucide-react';
import type { CommentsPulseSummary } from '@/lib/admin/comments-pulse';
import type { CommentFilterKind } from '@/lib/admin/comments-filter-utils';
import {
  COMMENT_SORT_OPTIONS,
  type CommentSortKind,
} from '@/lib/admin/comments-intelligence';
import type { CommentOriginKind } from '@/lib/admin/comments-scope-utils';
import CommentsScopeFilters from '@/components/admin/comments/CommentsScopeFilters';

const FILTERS: {
  id: CommentFilterKind;
  label: string;
  icon: typeof Filter;
  countKey?: keyof CommentsPulseSummary;
}[] = [
  { id: 'all', label: 'همه', icon: Filter },
  { id: 'pending', label: 'در انتظار', icon: Clock, countKey: 'pending' },
  { id: 'flagged', label: 'نیاز بررسی', icon: AlertTriangle, countKey: 'flagged' },
  { id: 'reported', label: 'ریپورت', icon: Flag, countKey: 'reported' },
  { id: 'approved', label: 'تایید', icon: CheckCircle, countKey: 'approved' },
  { id: 'filtered', label: 'کلمات بد', icon: AlertTriangle },
  { id: 'rejected', label: 'رد شده', icon: XCircle },
];

type Props = {
  currentFilter: CommentFilterKind;
  currentSearch: string;
  currentSort: CommentSortKind;
  currentOrigin: CommentOriginKind;
  currentCategoryId: string;
  currentListId: string;
  totalCount: number;
  pulse?: CommentsPulseSummary;
  onFilterChange: (filter: CommentFilterKind) => void;
  onSortChange: (sort: CommentSortKind) => void;
  onSearchChange: (search: string) => void;
  onOriginChange: (origin: CommentOriginKind) => void;
  onCategoryChange: (categoryId: string) => void;
  onListChange: (listId: string) => void;
  onRefresh: () => void;
};

export default function CommentsFilterBar({
  currentFilter,
  currentSearch,
  currentSort,
  currentOrigin,
  currentCategoryId,
  currentListId,
  totalCount,
  pulse,
  onFilterChange,
  onSortChange,
  onSearchChange,
  onOriginChange,
  onCategoryChange,
  onListChange,
  onRefresh,
}: Props) {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(
    null
  );

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

  return (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 mb-4 space-y-3"
      dir="rtl"
    >
      <div className="flex flex-col lg:flex-row gap-3">
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchChange(searchInput);
          }}
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="جستجو در متن کامنت…"
              className="w-full pr-10 pl-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>
        </form>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as CommentSortKind)}
            className="py-2 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
            aria-label="مرتب‌سازی"
          >
            {COMMENT_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">
            {totalCount.toLocaleString('fa-IR')} نتیجه
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
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
        {FILTERS.map(({ id, label, icon: Icon, countKey }) => {
          const active = currentFilter === id;
          const count =
            countKey && pulse ? pulse[countKey] : undefined;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilterChange(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                active
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border-muted)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count != null && count > 0 && (
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

      <CommentsScopeFilters
        origin={currentOrigin}
        categoryId={currentCategoryId}
        listId={currentListId}
        onOriginChange={onOriginChange}
        onCategoryChange={onCategoryChange}
        onListChange={onListChange}
      />

      <p className="text-[10px] text-[var(--color-text-subtle)] hidden sm:block">
        میانبر: <kbd className="px-1 rounded bg-[var(--color-bg)]">J</kbd>/<kbd className="px-1 rounded bg-[var(--color-bg)]">K</kbd> ردیف · <kbd className="px-1 rounded bg-[var(--color-bg)]">A</kbd> تایید · <kbd className="px-1 rounded bg-[var(--color-bg)]">R</kbd> رد
      </p>
    </div>
  );
}
