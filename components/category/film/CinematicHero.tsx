'use client';

import Link from 'next/link';
import CategoryHeroMedia from '@/components/category/CategoryHeroMedia';
import { getCategoryHeroDisplayUrl } from '@/lib/display-image';
import { getRandomPlaceholderUrl } from '@/lib/placeholder-images';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';

interface CinematicHeroProps {
  category: CategoryInfo;
  metrics: CategoryMetrics;
}

export default function CinematicHero({
  category,
  metrics,
}: CinematicHeroProps) {
  const heroImage = getCategoryHeroDisplayUrl(category.heroImage, category.slug)
    || getRandomPlaceholderUrl(`hero-film-${category.slug}`, 'cover');

  const growth =
    metrics.weeklyGrowthPercent != null && metrics.weeklyGrowthPercent !== 0
      ? metrics.weeklyGrowthPercent > 0
        ? `+${metrics.weeklyGrowthPercent.toLocaleString('fa-IR')}٪ این هفته`
        : `${metrics.weeklyGrowthPercent.toLocaleString('fa-IR')}٪ این هفته`
      : null;

  return (
    <section className="relative mt-3 overflow-hidden rounded-2xl lg:mt-5">
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-neutral-950 lg:aspect-[16/9]">
        <CategoryHeroMedia src={heroImage} alt={category.name} priority />

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-3.5 pb-4 text-right lg:p-7 lg:pb-6">
          <div className="mr-auto max-w-xl lg:max-w-2xl">
            <h1 className="wibe-h1 text-white lg:text-3xl lg:font-bold lg:tracking-tight">
              <span className="ml-1.5" aria-hidden>
                {category.icon}
              </span>
              {category.name}
            </h1>
            <p className="wibe-small mt-1 line-clamp-1 text-white/90 lg:mt-2 lg:line-clamp-2 lg:text-base lg:leading-relaxed">
              {category.description || 'بهترین لیست‌های سینمایی این هفته'}
            </p>

            <p className="mt-2 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 wibe-caption text-white/90 lg:mt-3 lg:text-sm">
              <span>
                {metrics.totalLists.toLocaleString('fa-IR')} لیست ·{' '}
                {metrics.totalItems.toLocaleString('fa-IR')} آیتم
              </span>
              {growth && (
                <>
                  <span className="text-white/50" aria-hidden>
                    ·
                  </span>
                  <span
                    className={
                      metrics.weeklyGrowthPercent! > 0
                        ? 'font-semibold text-emerald-300'
                        : 'text-white/75'
                    }
                  >
                    {growth}
                  </span>
                </>
              )}
            </p>

            <div className="mt-3 lg:mt-5">
              <Link
                href={`/lists?category=${category.slug}`}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 wibe-small font-semibold text-white transition-colors hover:bg-primary-dark lg:px-6 lg:text-sm"
              >
                کشف ترندها
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

}
