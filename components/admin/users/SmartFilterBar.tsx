'use client';

import { Bot, X } from 'lucide-react';
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
    <div className="mb-6 space-y-4">
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
        <input
          id="admin-user-search"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="نام، ایمیل یا نام کاربری"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none focus:ring-2 focus:ring-(--primary)"
        />
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-primary px-4 text-sm font-medium text-white hover:opacity-90"
        >
          جستجو
        </button>
        <label className="inline-flex min-h-11 items-center gap-2">
          <span className="text-sm text-wibe-secondary">مرتب‌سازی</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as UserSortKind)}
            aria-label="مرتب‌سازی"
            className="min-h-11 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text) focus:outline-none focus:ring-2 focus:ring-(--primary)"
          >
            {USER_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {USER_FILTER_PILLS.map((pill) => {
          const selected = value === pill.value;
          const count = filterCounts[pill.value];
          return (
            <button
              key={pill.value}
              type="button"
              onClick={() => onChange(pill.value)}
              aria-pressed={selected}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium ${
                selected
                  ? 'bg-primary text-white'
                  : 'bg-(--color-bg) text-wibe-secondary hover:text-(--color-text)'
              }`}
            >
              {pill.label}
              <span
                className={`tabular-nums text-xs ${
                  selected ? 'text-white/80' : 'text-(--color-text-subtle)'
                }`}
              >
                {faNumber(count)}
              </span>
            </button>
          );
        })}

        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm">
          <input
            type="checkbox"
            checked={hideBots}
            onChange={(e) => onHideBotsChange(e.target.checked)}
            className="rounded border-(--color-border) text-primary focus:ring-(--primary)"
          />
          <Bot className="h-4 w-4 text-wibe-secondary" strokeWidth={1.5} />
          <span>مخفی کردن بات‌ها</span>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
            پاک کردن فیلترها
          </button>
        )}
      </div>
    </div>
  );
}
