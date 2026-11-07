'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';
import {
  type CategoryBadgeFlags,
  formatSaveGrowthDisplay,
} from '@/lib/admin/category-intelligence-shared';
import CategoryBadges from './CategoryBadges';
import EngagementBar from './EngagementBar';
import CategoryActions from './CategoryActions';
import CategoryIcon from '@/components/shared/CategoryIcon';

interface CategoryCardProps {
  category: CategoryIntelligenceRow;
  badgeFlags: CategoryBadgeFlags;
  highlightNeedsBoost?: boolean;
  /** ردیف فشردهٔ لیست — ویرایش در همان نگاه */
  variant?: 'card' | 'row';
}

const growthToneClass: Record<string, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-wibe-secondary',
  new: 'text-sky-600 dark:text-sky-400',
};

function getCardBorderClass(
  category: CategoryIntelligenceRow,
  badges: CategoryBadgeFlags,
  highlightNeedsBoost?: boolean
) {
  if (highlightNeedsBoost) return 'ring-2 ring-amber-400/90 dark:ring-amber-500/70';
  if (!category.isActive) return 'border-dashed';
  // Subtle ring instead of thick side accent (avoids AI side-tab pattern)
  if (badges.isDeclining) return 'ring-1 ring-red-400/55 dark:ring-red-400/40';
  if (badges.isFastRising) return 'ring-1 ring-emerald-400/50 dark:ring-emerald-500/40';
  return '';
}

export default function CategoryCard({
  category,
  badgeFlags,
  highlightNeedsBoost = false,
  variant = 'card',
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

  if (variant === 'row') {
    const engagement =
      category.listCount > 0
        ? `${category.engagementRatio.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪`
        : '—';
    return (
      <div
        className={`flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-3 ${borderClass} ${
          category.isActive ? '' : 'bg-(--color-bg)/60'
        }`}
        dir="rtl"
      >
        <Link
          href={`/admin/categories/${category.id}/edit`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)"
        >
          <CategoryIcon
            icon={category.icon || '📁'}
            iconImage={category.iconImage}
            size="md"
            className="size-11 text-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-(--color-text)">{category.name}</h3>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                  category.isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-(--color-bg) text-wibe-secondary'
                }`}
              >
                {category.isActive ? 'فعال' : 'غیرفعال'}
              </span>
              {highlightNeedsBoost ? (
                <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  نیازمند تقویت
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-wibe-secondary">
              <span className="font-mono" dir="ltr">
                {category.slug}
              </span>
              <span> · </span>
              <span className="tabular-nums">
                {category.listCount.toLocaleString('fa-IR')} لیست ·{' '}
                {category.uniqueItemCount.toLocaleString('fa-IR')} آیتم · {engagement} تعامل
              </span>
              {growth.label !== '—' ? (
                <span className={growthToneClass[growth.tone]}> · رشد {growth.label}</span>
              ) : null}
              {weightLabel ? <span> · وزن {weightLabel}</span> : null}
            </p>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:opacity-90"
          >
            ویرایش
          </Link>
          {category.isActive ? (
            <Link
              href={`/categories/${category.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-11 items-center justify-center rounded-lg border border-(--color-border) text-wibe-secondary hover:bg-(--color-bg)"
              aria-label={`مشاهده ${category.name} در سایت`}
            >
              <ExternalLink className="size-4" strokeWidth={1.5} />
            </Link>
          ) : null}
          <CategoryActions
            categoryId={category.id}
            categorySlug={category.slug}
            categoryName={category.name}
            isActive={category.isActive}
            trendingWeight={category.trendingWeight}
            menuOnly
          />
        </div>
      </div>
    );
  }

  if (!category.isActive) {
    return (
      <div
        className={`rounded-xl border border-(--color-border) bg-(--color-bg)/80 shadow-sm ${borderClass}`}
        dir="rtl"
      >
        <Link
          href={`/admin/categories/${category.id}/edit`}
          className="flex items-center gap-3 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) rounded-t-xl"
        >
          <CategoryIcon
            icon={category.icon || '📁'}
            iconImage={category.iconImage}
            size="md"
            className="size-10 shrink-0 text-lg opacity-70"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-(--color-text) truncate">{category.name}</h3>
            <p className="text-xs text-wibe-secondary font-mono truncate" dir="ltr">
              {category.slug}
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-200/80 dark:bg-gray-700 text-wibe-secondary dark:text-(--color-text-subtle)">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            غیرفعال
          </span>
        </Link>
        <div className="px-4 pb-4 pt-0 border-t border-(--color-border)/60">
          <p className="text-xs text-wibe-secondary py-2">
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
      className={`rounded-xl border border-(--color-border) bg-(--color-surface) shadow-sm overflow-visible transition-shadow hover:shadow-md ${borderClass}`}
      dir="rtl"
    >
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="flex items-center gap-3 min-w-0 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) rounded-lg"
          >
            <CategoryIcon
              icon={category.icon || '📁'}
              iconImage={category.iconImage}
              size="md"
              className="size-11 shrink-0 text-lg"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-(--color-text) truncate">{category.name}</h3>
              <p className="text-xs text-wibe-secondary font-mono truncate" dir="ltr">
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
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              مشاهده در اپ
            </Link>
          </div>
        </div>

        <Link
          href={`/admin/categories/${category.id}/edit`}
          className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)"
        >
          <div className="mb-3 flex flex-wrap gap-1.5">
            {highlightNeedsBoost ? (
              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                ⚡ نیازمند Boost
              </span>
            ) : null}
            <CategoryBadges {...badgeFlags} />
          </div>

          <p className="text-sm text-(--color-text) mb-2 tabular-nums">
            <span className="font-semibold">{category.listCount.toLocaleString('fa-IR')}</span>
            <span className="text-wibe-secondary"> لیست · </span>
            <span className="font-semibold">{category.uniqueItemCount.toLocaleString('fa-IR')}</span>
            <span className="text-wibe-secondary"> آیتم یکتا · </span>
            {category.listCount > 0 ? (
              <span className="font-semibold">{category.engagementRatio.toFixed(1)}٪</span>
            ) : (
              <span className="font-semibold text-wibe-secondary">—</span>
            )}
            <span className="text-wibe-secondary"> تعامل</span>
            {growth.label !== '—' ? (
              <>
                <span className="text-wibe-secondary"> · </span>
                <span
                  className={`font-semibold ${growthToneClass[growth.tone]}`}
                  title={growth.title}
                >
                  رشد {growth.label}
                </span>
              </>
            ) : null}
            {weightLabel ? (
              <>
                <span className="text-wibe-secondary"> · </span>
                <span className="text-wibe-secondary">وزن {weightLabel}</span>
              </>
            ) : null}
          </p>

          <div className="mb-3">
            <EngagementBar percentage={category.engagementRatio} />
          </div>
        </Link>
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-(--color-border)">
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
