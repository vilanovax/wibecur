'use client';

import { ChevronLeft, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import Link from 'next/link';
import type { TopCategory } from '@/lib/admin/types';

interface TopCategoriesPanelProps {
  categories: TopCategory[];
}

export default function TopCategoriesPanel({ categories }: TopCategoriesPanelProps) {
  return (
    <div className="rounded-[16px] p-4 sm:p-5 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text)]">
          سلامت دسته‌بندی‌ها
        </h3>
        <Link
          href="/admin/categories"
          className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5"
        >
          همه
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
      <ul className="space-y-2 flex-1">
        {categories.length === 0 ? (
          <li className="text-sm text-[var(--color-text-muted)] py-4">
            دسته‌ای یافت نشد.
          </li>
        ) : (
          categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/admin/categories/${cat.id}/edit`}
                className="flex items-center justify-between gap-2 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-bg)] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {cat.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {cat.listCount.toLocaleString('fa-IR')} لیست
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-[var(--color-text)]">
                    {cat.sharePercent}٪
                  </span>
                  {cat.delta !== undefined && cat.delta !== 0 && (
                    <span
                      className={`inline-flex items-center ${
                        cat.delta > 0
                          ? 'text-emerald-600'
                          : cat.delta < 0
                            ? 'text-red-600'
                            : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      {cat.delta > 0 && <ArrowUp className="w-3 h-3" />}
                      {cat.delta < 0 && <ArrowDown className="w-3 h-3" />}
                      {cat.delta === 0 && <Minus className="w-3 h-3" />}
                      {Math.abs(cat.delta)}٪
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
