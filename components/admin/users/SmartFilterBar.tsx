'use client';

import { Bot, Search, X } from 'lucide-react';
import {
  USER_FILTER_PILLS,
  type UserFilterKind,
} from '@/lib/admin/user-filter-utils';
import {
  USER_SORT_OPTIONS,
  type UserSortKind,
} from '@/lib/admin/users-types';
import { faNumber } from '@/lib/utils';

interface SmartFilterBarProps {
  value: UserFilterKind;
  onChange: (value: UserFilterKind) => void;
  filterCounts: Record<UserFilterKind, number>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  hideBots: boolean;
  onHideBotsChange: (hide: boolean) => void;
  sort: UserSortKind;
  onSortChange: (sort: UserSortKind) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function SmartFilterBar({
  value,
  onChange,
  filterCounts,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  hideBots,
  onHideBotsChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: SmartFilterBarProps) {
  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <label htmlFor="admin-user-search" className="sr-only">
          جستجوی کاربر
        </label>
        <div className="relative min-w-0 flex-1 basis-full sm:basis-56">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-wibe-secondary"
            strokeWidth={1.5}
          />
          <input
            id="admin-user-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="نام، موبایل یا نام کاربری"
            className="min-h-11 w-full rounded-xl border border-(--color-border) bg-(--color-surface) pe-3 ps-10 text-sm text-(--color-text) placeholder:text-wibe-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-white hover:opacity-90"
        >
          جستجو
        </button>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as UserSortKind)}
          aria-label="مرتب‌سازی"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text) focus:outline-none focus:ring-2 focus:ring-primary/30 sm:flex-none"
        >
          {USER_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </form>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {USER_FILTER_PILLS.map((pill) => {
          const selected = value === pill.value;
          const count = filterCounts[pill.value];
          const empty = count === 0 && pill.value !== 'all';
          return (
            <button
              key={pill.value}
              type="button"
              onClick={() => onChange(pill.value)}
              aria-pressed={selected}
              disabled={empty}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selected
                  ? 'bg-primary text-white'
                  : 'border border-(--color-border) bg-(--color-surface) text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)'
              }`}
            >
              {pill.label}
              <span
                className={`tabular-nums text-sm ${
                  selected ? 'text-white/80' : 'text-wibe-secondary'
                }`}
              >
                {faNumber(count)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-wibe-secondary">
          <input
            type="checkbox"
            checked={hideBots}
            onChange={(e) => onHideBotsChange(e.target.checked)}
            className="size-4 rounded border-(--color-border) text-primary focus:ring-primary/30"
          />
          <Bot className="size-4" strokeWidth={1.5} />
          <span>مخفی‌کردن بات‌ها</span>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)"
          >
            <X className="size-4" strokeWidth={1.5} />
            پاک‌کردن فیلترها
          </button>
        )}
      </div>
    </div>
  );
}
