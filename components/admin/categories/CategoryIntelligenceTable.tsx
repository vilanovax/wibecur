'use client';

import { useRouter } from 'next/navigation';
import { Pencil, BarChart3, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';
import {
  formatSaveGrowthDisplay,
  getCategoryBadgeFlags,
} from '@/lib/admin/category-intelligence';
import { getCategoryLayoutLabel } from '@/lib/admin/category-form-constants';
import { getDisplayImageUrl } from '@/lib/display-image';
import CategoryBadges from './CategoryBadges';

interface CategoryIntelligenceTableProps {
  categories: CategoryIntelligenceRow[];
  highlightNeedsBoostIds?: Set<string>;
}

export default function CategoryIntelligenceTable({
  categories,
  highlightNeedsBoostIds,
}: CategoryIntelligenceTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <thead className="bg-[var(--color-bg)] sticky top-0 z-10">
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                دسته‌بندی
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] w-16">
                هیرو
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                چیدمان
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                لیست‌ها
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                رشد ۷روز
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                تعامل
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                میانگین ذخیره
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                وزن
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                وضعیت
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] w-28">
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
              const heroSrc = getDisplayImageUrl(cat.heroImage, cat.slug);
              const layoutLabel = getCategoryLayoutLabel(cat.layoutType);
              return (
                <tr
                  key={cat.id}
                  onClick={() => router.push(`/admin/categories/${cat.id}/edit`)}
                  className={`hover:bg-[var(--color-bg)] transition-colors cursor-pointer ${
                    !cat.isActive ? 'opacity-70 bg-[var(--color-bg)]/50' : ''
                  } ${highlightBoost ? 'ring-2 ring-inset ring-amber-400/70' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0"
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
                  <td className="px-4 py-3">
                    {heroSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroSrc}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)]"
                      />
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                    {cat.layoutType ? (
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs bg-[var(--color-bg)] border border-[var(--color-border)]">
                        {layoutLabel}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-[var(--color-text)]">
                    {cat.listCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-sm tabular-nums text-[var(--color-text)]">
                    {cat.engagementRatio.toFixed(1)}٪
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-[var(--color-text)]">
                    {cat.avgSavesPerList.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-[var(--color-text)]">
                    {cat.trendingWeight.toLocaleString('fa-IR')}×
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${
                        cat.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {cat.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/categories/${cat.id}/edit`}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                        title="ویرایش"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/analytics?category=${cat.id}`}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        title="آنالیتیکس"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/categories/${cat.slug}`}
                        target="_blank"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        title="مشاهده در اپ"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {categories.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          دسته‌ای یافت نشد.
        </div>
      )}
    </div>
  );
}
