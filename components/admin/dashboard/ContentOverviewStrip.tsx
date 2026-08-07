'use client';

import Link from 'next/link';
import {
  Tag,
  List,
  Package,
  Users,
  Eye,
  Bookmark,
  Percent,
  ChevronLeft,
} from 'lucide-react';
import type { ContentOverview } from '@/lib/admin/types';

interface ContentOverviewStripProps {
  overview: ContentOverview;
}

const tiles = [
  {
    key: 'categories' as const,
    label: 'دسته',
    href: '/admin/categories',
    icon: Tag,
  },
  {
    key: 'lists' as const,
    label: 'لیست',
    href: '/admin/lists',
    icon: List,
  },
  {
    key: 'items' as const,
    label: 'آیتم',
    href: '/admin/items',
    icon: Package,
  },
  {
    key: 'users' as const,
    label: 'کاربر',
    href: '/admin/users',
    icon: Users,
  },
] as const;

export default function ContentOverviewStrip({ overview }: ContentOverviewStripProps) {
  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/60">
        <p className="text-sm font-semibold text-[var(--color-text)]">
          وضعیت محتوا
        </p>
        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
        >
          مرکز محتوا
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
        </Link>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiles.map(({ key, label, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-3 py-3 transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--color-bg)]"
            >
              <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-1">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold tabular-nums text-[var(--color-text)]">
                {overview[key].toLocaleString('fa-IR')}
              </p>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-1 border-t border-[var(--color-border-muted)]">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-3 py-2">
            <Eye className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs text-[var(--color-text-muted)]">بازدید کل</span>
            <strong className="text-sm tabular-nums text-[var(--color-text)]">
              {overview.totalViews.toLocaleString('fa-IR')}
            </strong>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-3 py-2">
            <Bookmark className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-[var(--color-text-muted)]">ذخیره کل</span>
            <strong className="text-sm tabular-nums text-[var(--color-text)]">
              {overview.totalSaves.toLocaleString('fa-IR')}
            </strong>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-3 py-2">
            <Percent className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="text-xs text-[var(--color-text-muted)]">نرخ ذخیره</span>
            <strong className="text-sm tabular-nums text-[var(--color-text)]">
              {overview.saveRate}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
