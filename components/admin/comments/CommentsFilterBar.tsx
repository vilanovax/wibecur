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
  SlidersHorizontal,
  ChevronDown,
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
  urgent?: boolean;
}[] = [
  { id: 'pending', label: 'در انتظار', icon: Clock, countKey: 'pending', urgent: true },
  { id: 'flagged', label: 'نیاز بررسی', icon: AlertTriangle, countKey: 'flagged', urgent: true },
  { id: 'reported', label: 'ریپورت', icon: Flag, countKey: 'reported', urgent: true },
  { id: 'approved', label: 'تایید شده', icon: CheckCircle, countKey: 'approved' },
  { id: 'filtered', label: 'کلمات بد', icon: AlertTriangle },
  { id: 'rejected', label: 'رد شده', icon: XCircle },
  { id: 'all', label: 'همه', icon: Filter },
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

  const scopeActive =
    currentOrigin !== 'all' || !!currentCategoryId || !!currentListId;
  const [scopeOpen, setScopeOpen] = useState(scopeActive);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (scopeActive) setScopeOpen(true);
  }, [scopeActive]);

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

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
      className="mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 space-y-2"
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 gap-1 overflow-x-auto scrollbar-thin min-w-0"
          role="tablist"
          aria-label="فیلتر وضعیت"
        >
          {FILTERS.map(({ id, label, icon: Icon, countKey, urgent }) => {
            const active = currentFilter === id;
            const count = countKey && pulse ? pulse[countKey] : undefined;
            const showBadge = count != null && count > 0;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 ${
                  active
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border-muted)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-90" />
                {label}
                {showBadge && (
                  <span
                    className={`min-w-[1.1rem] px-1 rounded-full text-xs font-bold tabular-nums leading-none py-0.5 ${
                      active
                        ? 'bg-white/25 text-white'
                        : urgent
                          ? 'bg-rose-500 text-white'
                          : 'bg-[var(--color-border-muted)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {count.toLocaleString('fa-IR')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <span className="hidden sm:inline text-xs text-[var(--color-text-muted)] tabular-nums shrink-0">
          {totalCount.toLocaleString('fa-IR')}
        </span>
        <select
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as CommentSortKind)}
          className="hidden md:block py-1.5 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35"
          aria-label="مرتب‌سازی"
          title="مرتب‌سازی · میانبر: J/K ردیف، A تایید، R رد"
        >
          {COMMENT_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35"
          aria-label="بروزرسانی"
          title="بروزرسانی · J/K ردیف · A تایید · R رد"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <form
          className="flex-1 min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchChange(searchInput);
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="جستجو در متن کامنت…"
              className="w-full pr-9 pl-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
            />
          </div>
        </form>

        <select
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as CommentSortKind)}
          className="md:hidden py-1.5 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-xs shrink-0"
          aria-label="مرتب‌سازی"
        >
          {COMMENT_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setScopeOpen((v) => !v)}
          aria-expanded={scopeOpen}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35 ${
            scopeActive || scopeOpen
              ? 'border-[var(--primary)]/40 bg-[var(--primary)]/8 text-[var(--primary)]'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">محدوده</span>
          {scopeActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" aria-hidden />
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${scopeOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {scopeOpen && (
        <CommentsScopeFilters
          origin={currentOrigin}
          categoryId={currentCategoryId}
          listId={currentListId}
          onOriginChange={onOriginChange}
          onCategoryChange={onCategoryChange}
          onListChange={onListChange}
        />
      )}
    </div>
  );
}
