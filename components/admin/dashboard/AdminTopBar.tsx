'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Plus, Package, Shield } from 'lucide-react';
import Link from 'next/link';
import { parseDashboardRange, type DashboardRange } from '@/lib/admin/dashboard-range';

const RANGES = [
  { key: 'today' as const, label: 'امروز' },
  { key: '7d' as const, label: '۷ روز' },
  { key: '30d' as const, label: '۳۰ روز' },
];

interface AdminTopBarProps {
  initialRange?: DashboardRange;
}

export default function AdminTopBar({ initialRange = 'today' }: AdminTopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rangeFromUrl = parseDashboardRange(searchParams.get('range'));
  const [range, setRange] = useState<DashboardRange>(rangeFromUrl ?? initialRange);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    setRange(rangeFromUrl);
  }, [rangeFromUrl]);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const setRangeInUrl = useCallback(
    (next: DashboardRange) => {
      setRange(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'today') {
        params.delete('range');
      } else {
        params.set('range', next);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/admin/lists/user-created?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className="h-18 max-h-18 flex items-center gap-4 px-0 py-3 border-b border-(--color-border) bg-(--color-surface) shrink-0">
      <div className="flex items-center justify-between w-full gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold text-(--color-text)">
            داشبورد مدیریت
          </h1>
          <div className="flex items-center gap-1 p-1 rounded-(--radius-md) bg-(--color-bg)">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRangeInUrl(r.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  range === r.key
                    ? 'bg-(--color-surface) text-(--color-text) shadow-sm'
                    : 'text-wibe-secondary hover:text-(--color-text)'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-md min-w-50"
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-subtle)" />
            <input
              type="search"
              placeholder="جستجو (کاربر، لیست، آیتم)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) text-sm text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/lists/new"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-(--radius-md) bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">ایجاد لیست</span>
          </Link>
          <Link
            href="/admin/lists?view=catalog&mode=place"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-(--radius-md) border border-(--color-border) text-(--color-text) text-sm font-medium hover:bg-(--color-bg) transition-colors"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">افزودن آیتم</span>
          </Link>
          <Link
            href="/admin/comments"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-(--radius-md) border border-(--color-danger)/30 text-(--color-danger) text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">نظارت کامنت</span>
          </Link>
          <Link
            href="/admin/moderation"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-(--radius-md) border border-(--color-border) text-wibe-secondary text-sm font-medium hover:bg-(--color-bg) transition-colors"
          >
            <span className="hidden sm:inline">صف بررسی</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
