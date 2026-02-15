'use client';

import { useState } from 'react';
import { Search, Plus, Package, Shield } from 'lucide-react';
import Link from 'next/link';

const RANGES = [
  { key: 'today', label: 'امروز' },
  { key: '7d', label: '۷ روز' },
  { key: '30d', label: '۳۰ روز' },
] as const;

export default function AdminTopBar() {
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('today');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-[72px] max-h-[72px] flex items-center gap-4 px-0 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
      <div className="flex items-center justify-between w-full gap-4 flex-wrap">
        {/* Title + Date range */}
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold text-[var(--color-text)]">
            داشبورد مدیریت
          </h1>
          <div className="flex items-center gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--color-bg)]">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  range === r.key
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global search */}
        <div className="flex-1 max-w-md min-w-[200px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-subtle)]" />
            <input
              type="search"
              placeholder="جستجو (کاربر، لیست، آیتم)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/lists/new"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">ایجاد لیست</span>
          </Link>
          <Link
            href="/admin/items/new"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)] transition-colors"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">افزودن آیتم</span>
          </Link>
          <Link
            href="/admin/comments/item-reports"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">صف مودریشن</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
