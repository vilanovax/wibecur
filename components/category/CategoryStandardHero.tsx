'use client';

import Link from 'next/link';
import CategoryHeroMedia from '@/components/category/CategoryHeroMedia';
import { getCategoryHeroDisplayUrl } from '@/lib/display-image';
import { getRandomPlaceholderUrl } from '@/lib/placeholder-images';
import { isLocationCategorySlug } from '@/lib/category-layout';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';

interface CategoryStandardHeroProps {
  category: CategoryInfo;
  metrics: CategoryMetrics;
}

export default function CategoryStandardHero({ category, metrics }: CategoryStandardHeroProps) {
  const heroImage =
    getCategoryHeroDisplayUrl(category.heroImage, category.slug) ||
    getRandomPlaceholderUrl(`hero-${category.slug}`, 'cover');

  const showCityLink = isLocationCategorySlug(category.slug);
  const growth =
    metrics.weeklyGrowthPercent != null && metrics.weeklyGrowthPercent !== 0
      ? metrics.weeklyGrowthPercent > 0
        ? `+${metrics.weeklyGrowthPercent.toLocaleString('fa-IR')}٪ این هفته`
        : `${metrics.weeklyGrowthPercent.toLocaleString('fa-IR')}٪ این هفته`
      : null;

  return (
    <section className="relative mb-1 mt-3 overflow-hidden rounded-2xl lg:mt-4">
      <div className="relative aspect-[16/9] w-full min-h-[200px] overflow-hidden bg-neutral-950">
        <CategoryHeroMedia src={heroImage} alt={category.name} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5 text-right lg:p-6 lg:pb-6">
          <h1 className="wibe-h1 text-white lg:text-3xl">
            <span className="ml-1.5" aria-hidden>
              {category.icon}
            </span>
            {category.name}
          </h1>
          <p className="mt-1 line-clamp-2 wibe-small text-white/90 lg:text-base">
            {category.description || `بهترین لیست‌های ${category.name}`}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 wibe-caption text-white/95 lg:text-sm">
            <span>{metrics.totalLists.toLocaleString('fa-IR')} لیست</span>
            <span aria-hidden>·</span>
            <span>{metrics.totalItems.toLocaleString('fa-IR')} آیتم</span>
            {metrics.weeklySaveCount > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>{metrics.weeklySaveCount.toLocaleString('fa-IR')} ذخیره این هفته</span>
              </>
            )}
            {growth && (
              <>
                <span aria-hidden>·</span>
                <span
                  className={
                    metrics.weeklyGrowthPercent! > 0
                      ? 'font-semibold text-emerald-300'
                      : 'text-white/80'
                  }
                >
                  {growth}
                </span>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/lists?category=${category.slug}&create=1`}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 wibe-small font-semibold text-white transition-colors hover:bg-primary-dark sm:flex-none sm:px-6"
            >
              ساخت لیست در این دسته
            </Link>
            {showCityLink && (
              <Link
                href="#explore-by-city"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/40 px-4 py-3 wibe-small font-medium text-white/95 transition-colors hover:bg-white/10 sm:flex-none"
              >
                انتخاب شهر
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
