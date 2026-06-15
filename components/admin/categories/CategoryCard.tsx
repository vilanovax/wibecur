'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';
import {
  type CategoryBadgeFlags,
  formatSaveGrowthDisplay,
} from '@/lib/admin/category-intelligence';
import CategoryBadges from './CategoryBadges';
import EngagementBar from './EngagementBar';
import CategoryActions from './CategoryActions';

interface CategoryCardProps {
  category: CategoryIntelligenceRow;
  badgeFlags: CategoryBadgeFlags;
  highlightNeedsBoost?: boolean;
}

const growthToneClass: Record<string, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-[var(--color-text-muted)]',
  new: 'text-sky-600 dark:text-sky-400',
};

function getCardBorderClass(
  category: CategoryIntelligenceRow,
  badges: CategoryBadgeFlags,
  highlightNeedsBoost?: boolean
) {
  if (highlightNeedsBoost) return 'ring-2 ring-amber-400/90 dark:ring-amber-500/70';
  if (!category.isActive) return 'border-dashed';
  if (badges.isDeclining) return 'border-r-4 border-r-red-500 dark:border-r-red-400';
  if (badges.isFastRising) return 'ring-1 ring-emerald-400/50 dark:ring-emerald-500/40';
  return '';
}

export default function CategoryCard({
  category,
  badgeFlags,
  highlightNeedsBoost = false,
}: CategoryCardProps) {
  const growth = formatSaveGrowthDisplay(
    category.saveGrowthRecent,
    category.saveGrowthPrevious,
    category.saveGrowthPercent
  );
  const borderClass = getCardBorderClass(category, badgeFlags, highlightNeedsBoost);
  const weightLabel =
    category.isActive && category.trendingWeight !== 1
      ? `${category.trendingWeight.toLocaleString('fa-IR')}×`
      : null;

  if (!category.isActive) {
    return (
      <div
        className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/80 shadow-sm ${borderClass}`}
        dir="rtl"
      >
        <Link
          href={`/admin/categories/${category.id}/edit`}
          className="flex items-center gap-3 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-t-xl"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 opacity-70"
            style={{
              backgroundColor: category.color ? `${category.color}15` : 'var(--color-surface)',
            }}
          >
            {category.icon || '📁'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--color-text)] truncate">{category.name}</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono truncate" dir="ltr">
              {category.slug}
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-200/80 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            غیرفعال
          </span>
        </Link>
        <div className="px-4 pb-4 pt-0 border-t border-[var(--color-border)]/60">
          <p className="text-xs text-[var(--color-text-muted)] py-2">
            {category.listCount > 0
              ? `${category.listCount.toLocaleString('fa-IR')} لیست · ${category.uniqueItemCount.toLocaleString('fa-IR')} آیتم یکتا · در اپ نمایش داده نمی‌شود`
              : 'بدون لیست · برای انتشار فعال کنید'}
          </p>
          <CategoryActions
            categoryId={category.id}
            categorySlug={category.slug}
            categoryName={category.name}
            isActive={false}
            trendingWeight={category.trendingWeight}
            compact
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-visible transition-shadow hover:shadow-md ${borderClass}`}
      dir="rtl"
    >
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="flex items-center gap-3 min-w-0 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-lg"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg"
              style={{
                backgroundColor: category.color ? `${category.color}20` : 'var(--color-bg)',
                color: category.color || undefined,
              }}
            >
              {category.icon || '📁'}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[var(--color-text)] truncate">{category.name}</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono truncate" dir="ltr">
                {category.slug}
              </p>
            </div>
          </Link>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              فعال
            </span>
            <Link
              href={`/categories/${category.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              مشاهده در اپ
            </Link>
          </div>
        </div>

        <Link
          href={`/admin/categories/${category.id}/edit`}
          className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <div className="mb-3 flex flex-wrap gap-1.5">
            {highlightNeedsBoost && (
              <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                ⚡ نیازمند Boost
              </span>
            )}
            <CategoryBadges {...badgeFlags} />
          </div>

          <p className="text-sm text-[var(--color-text)] mb-2 tabular-nums">
            <span className="font-semibold">{category.listCount.toLocaleString('fa-IR')}</span>
            <span className="text-[var(--color-text-muted)]"> لیست · </span>
            <span className="font-semibold">{category.uniqueItemCount.toLocaleString('fa-IR')}</span>
            <span className="text-[var(--color-text-muted)]"> آیتم یکتا · </span>
            {category.listCount > 0 ? (
              <span className="font-semibold">{category.engagementRatio.toFixed(1)}٪</span>
            ) : (
              <span className="font-semibold text-[var(--color-text-muted)]">—</span>
            )}
            <span className="text-[var(--color-text-muted)]"> تعامل</span>
            {growth.label !== '—' && (
              <>
                <span className="text-[var(--color-text-muted)]"> · </span>
                <span
                  className={`font-semibold ${growthToneClass[growth.tone]}`}
                  title={growth.title}
                >
                  رشد {growth.label}
                </span>
              </>
            )}
            {weightLabel && (
              <>
                <span className="text-[var(--color-text-muted)]"> · </span>
                <span className="text-[var(--color-text-muted)]">وزن {weightLabel}</span>
              </>
            )}
          </p>

          <div className="mb-3">
            <EngagementBar percentage={category.engagementRatio} />
          </div>
        </Link>
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-[var(--color-border)]">
        <CategoryActions
          categoryId={category.id}
          categorySlug={category.slug}
          categoryName={category.name}
          isActive
          trendingWeight={category.trendingWeight}
        />
      </div>
    </div>
  );
}
