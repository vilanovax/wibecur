'use client';

import { Bot, X } from 'lucide-react';
import {
  USER_FILTER_PILLS,
  type UserFilterKind,
} from '@/lib/admin/user-filter-utils';
import {
  USER_SORT_OPTIONS,
  type UserSortKind,
} from '@/lib/admin/users-intelligence';

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
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {USER_FILTER_PILLS.map((p) => {
            const count = filterCounts[p.value];
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange(p.value)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  value === p.value
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'
                }`}
              >
                {p.label}
                <span
                  className={`tabular-nums text-xs px-1.5 py-0.5 rounded-md ${
                    value === p.value
                      ? 'bg-white/20'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {count.toLocaleString('fa-IR')}
                </span>
              </button>
            );
          })}
        </div>

        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideBots}
            onChange={(e) => onHideBotsChange(e.target.checked)}
            className="rounded border-[var(--color-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
          />
          <Bot className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="text-[var(--color-text)]">مخفی کردن بات‌ها</span>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
          >
            <X className="w-4 h-4" />
            پاک کردن فیلترها
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-[var(--color-text-muted)] shrink-0">مرتب‌سازی</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as UserSortKind)}
          className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          {USER_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
        className="flex items-center gap-2 flex-wrap"
      >
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجو نام، ایمیل، نام کاربری..."
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          جستجو
        </button>
      </form>
    </div>
  );
}
