'use client';

import Link from 'next/link';
import { Flame, Tag, Eye, Bookmark, ChevronLeft, ExternalLink } from 'lucide-react';
import type { TopList, TopCategory } from '@/lib/admin/types';

interface TopContentPanelsProps {
  topLists: TopList[];
  topCategories: TopCategory[];
}

export default function TopContentPanels({
  topLists,
  topCategories,
}: TopContentPanelsProps) {
  const lists = topLists.slice(0, 6);
  const categories = topCategories.slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-4">
      <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-card) overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-(--color-border)">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-(--color-text)">
              برترین لیست‌ها
            </h2>
          </div>
          <Link
            href="/admin/lists"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            همه
            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
        <ul className="divide-y divide-(--color-border-muted)">
          {lists.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-wibe-secondary">
              لیستی یافت نشد.
            </li>
          ) : (
            lists.map((list, i) => (
              <li key={list.id}>
                <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-(--color-bg) transition-colors group">
                  <span className="text-xs font-medium text-wibe-secondary w-5 shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/lists/${list.id}/edit`}
                      className="text-sm font-medium text-(--color-text) truncate block hover:text-primary"
                    >
                      {list.title}
                    </Link>
                    <p className="text-[11px] text-wibe-secondary truncate">
                      {list.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[11px] text-wibe-secondary">
                    <span className="inline-flex items-center gap-0.5" title="بازدید">
                      <Eye className="w-3 h-3" />
                      {list.viewCount.toLocaleString('fa-IR')}
                    </span>
                    <span className="inline-flex items-center gap-0.5" title="ذخیره">
                      <Bookmark className="w-3 h-3" />
                      {list.saveCount.toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <Link
                    href={`/lists/${list.slug}`}
                    target="_blank"
                    className="shrink-0 p-1 rounded-lg text-wibe-secondary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    title="مشاهده در سایت"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-card) overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-(--color-border)">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-(--color-text)">
              دسته‌های پرلیست
            </h2>
          </div>
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            همه
            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
        <ul className="divide-y divide-(--color-border-muted)">
          {categories.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-wibe-secondary">
              دسته‌ای یافت نشد.
            </li>
          ) : (
            categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/admin/categories/${cat.id}/edit`}
                  className="flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-(--color-bg) transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-(--color-text) truncate">
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-wibe-secondary">
                      {cat.sharePercent.toLocaleString('fa-IR')}٪ از کل لیست‌ها
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-(--color-text) shrink-0">
                    {cat.listCount.toLocaleString('fa-IR')}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
