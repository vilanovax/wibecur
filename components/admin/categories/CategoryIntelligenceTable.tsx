'use client';

import { Pencil } from 'lucide-react';
import Link from 'next/link';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';
import {
  formatSaveGrowthDisplay,
  getCategoryBadgeFlags,
} from '@/lib/admin/category-intelligence-shared';
import CategoryBadges from './CategoryBadges';

interface CategoryIntelligenceTableProps {
  categories: CategoryIntelligenceRow[];
  highlightNeedsBoostIds?: Set<string>;
}

export default function CategoryIntelligenceTable({
  categories,
  highlightNeedsBoostIds,
}: CategoryIntelligenceTableProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-[var(--color-bg)]">
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-3 py-3 text-start text-xs font-semibold text-[var(--color-text-muted)]">
                دسته‌بندی
              </th>
              <th className="hidden px-3 py-3 text-start text-xs font-semibold text-[var(--color-text-muted)] md:table-cell">
                لیست
              </th>
              <th className="hidden px-3 py-3 text-start text-xs font-semibold text-[var(--color-text-muted)] md:table-cell">
                آیتم
              </th>
              <th className="hidden px-3 py-3 text-start text-xs font-semibold text-[var(--color-text-muted)] lg:table-cell">
                رشد
              </th>
              <th className="hidden px-3 py-3 text-start text-xs font-semibold text-[var(--color-text-muted)] lg:table-cell">
                تعامل
              </th>
              <th className="px-3 py-3 text-start text-xs font-semibold text-[var(--color-text-muted)]">
                وضعیت
              </th>
              <th className="sticky end-0 bg-[var(--color-bg)] px-3 py-3 text-start text-xs font-semibold text-[var(--color-text-muted)]">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {categories.map((cat) => {
              const badges = getCategoryBadgeFlags(cat);
              const growth = formatSaveGrowthDisplay(
                cat.saveGrowthRecent,
                cat.saveGrowthPrevious,
                cat.saveGrowthPercent
              );
              const highlightBoost = highlightNeedsBoostIds?.has(cat.id);
              return (
                <tr
                  key={cat.id}
                  className={`transition-colors hover:bg-[var(--color-bg)] ${
                    !cat.isActive ? 'bg-[var(--color-bg)]/50 opacity-70' : ''
                  } ${highlightBoost ? 'ring-2 ring-inset ring-amber-400/70' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm"
                        style={{
                          backgroundColor: cat.color ? `${cat.color}20` : undefined,
                          color: cat.color || undefined,
                        }}
                      >
                        {cat.icon || '📁'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--color-text)]">{cat.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] font-mono" dir="ltr">
                          {cat.slug}
                        </p>
                        <div className="mt-1">
                          <CategoryBadges {...badges} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-sm tabular-nums text-[var(--color-text)] md:table-cell">
                    {cat.listCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="hidden px-3 py-3 text-sm tabular-nums text-[var(--color-text)] md:table-cell">
                    {cat.uniqueItemCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="hidden px-3 py-3 lg:table-cell">
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        growth.tone === 'positive' || growth.tone === 'new'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : growth.tone === 'negative'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-[var(--color-text-muted)]'
                      }`}
                      title={growth.title}
                    >
                      {growth.label}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-sm tabular-nums text-[var(--color-text)] lg:table-cell">
                    {cat.engagementRatio.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${
                        cat.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'bg-gray-100 text-[var(--color-text-muted)] dark:bg-gray-700 dark:text-[var(--color-text-subtle)]'
                      }`}
                    >
                      {cat.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="sticky end-0 bg-[var(--color-surface)] px-3 py-2">
                    <Link
                      href={`/admin/categories/${cat.id}/edit`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-sm font-medium text-white hover:opacity-90"
                    >
                      <Pencil className="size-4" strokeWidth={1.5} />
                      ویرایش
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {categories.length === 0 && (
        <div className="py-12 text-center text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)]">
          دسته‌ای یافت نشد.
        </div>
      )}
    </div>
  );
}
