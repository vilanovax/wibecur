'use client';

import { TrendingUp, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { TopList } from '@/lib/admin/types';

interface TopListsPanelProps {
  lists: TopList[];
}

export default function TopListsPanel({ lists }: TopListsPanelProps) {
  return (
    <div className="rounded-[16px] p-4 sm:p-5 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text)]">
          برترین لیست‌ها
        </h3>
        <Link
          href="/admin/lists"
          className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5"
        >
          همه
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
      <ul className="space-y-2 flex-1">
        {lists.length === 0 ? (
          <li className="text-sm text-[var(--color-text-muted)] py-4">
            لیستی یافت نشد.
          </li>
        ) : (
          lists.map((list) => (
            <li key={list.id}>
              <Link
                href={`/admin/lists/${list.id}/edit`}
                className="flex items-start justify-between gap-2 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-bg)] transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">
                    {list.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {list.category} · ذخیره {list.saveCount.toLocaleString('fa-IR')} · بازدید{' '}
                    {list.viewCount.toLocaleString('fa-IR')}
                  </p>
                </div>
                {list.isTrending && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-xs">
                    <TrendingUp className="w-3 h-3" />
                    ترند
                  </span>
                )}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
