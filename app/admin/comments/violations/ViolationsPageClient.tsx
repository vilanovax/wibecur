'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Search, X, RefreshCw } from 'lucide-react';
import CommentsSubNav, { type CommentsNavStats } from '@/components/admin/comments/CommentsSubNav';
import ViolationsPageHeader from '@/components/admin/comments/ViolationsPageHeader';
import ViolationsStatsBar from '@/components/admin/comments/ViolationsStatsBar';
import ViolationsTable, { type ViolationRow } from '@/components/admin/comments/ViolationsTable';

type Stats = {
  totalOffenders: number;
  totalViolations: number;
  totalPenalty: number;
};

interface ViolationsPageClientProps {
  violations: ViolationRow[];
  stats: Stats;
  search: string;
  navStats?: CommentsNavStats;
}

export default function ViolationsPageClient({
  violations = [],
  stats,
  search: initialSearch,
  navStats,
}: ViolationsPageClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);

  const applySearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams();
      const q = value.trim();
      if (q) params.set('search', q);
      const qs = params.toString();
      router.push(
        qs ? `/admin/comments/violations?${qs}` : '/admin/comments/violations'
      );
    },
    [router]
  );

  return (
    <div dir="rtl">
      <ViolationsPageHeader />
      {navStats && <CommentsSubNav stats={navStats} />}

      <ViolationsStatsBar
        totalOffenders={stats.totalOffenders}
        totalViolations={stats.totalViolations}
        totalPenalty={stats.totalPenalty}
      />

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 mb-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            applySearch(searchInput);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="جستجو نام یا ایمیل کاربر…"
              className="w-full pr-10 pl-9 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  applySearch('');
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[var(--color-border-muted)]"
              >
                <X className="w-4 h-4 text-[var(--color-text-muted)]" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium shrink-0"
          >
            جستجو
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)] shrink-0"
            aria-label="بروزرسانی"
          >
            <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
        </form>
      </div>

      {violations.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <Ban className="w-12 h-12 mx-auto text-[var(--color-text-muted)] opacity-40 mb-3" />
          <p className="text-[var(--color-text-muted)]">
            {initialSearch
              ? 'کاربری با این مشخصات یافت نشد'
              : 'کاربر خاطی‌ای ثبت نشده است'}
          </p>
          {initialSearch && (
            <button
              type="button"
              onClick={() => applySearch('')}
              className="mt-3 text-sm text-[var(--primary)] hover:underline"
            >
              پاک کردن جستجو
            </button>
          )}
        </div>
      ) : (
        <ViolationsTable violations={violations} />
      )}
    </div>
  );
}
