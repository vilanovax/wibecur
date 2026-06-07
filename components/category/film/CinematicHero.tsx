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

  return (
    <section className="relative mt-3 overflow-hidden rounded-2xl lg:mt-5">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-950">
        <CategoryHeroMedia src={heroImage} alt={category.name} priority />

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/55 via-black/15 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5 text-right lg:p-7 lg:pb-6">
          <div className="mr-auto max-w-xl lg:max-w-2xl">
            <h1 className="wibe-h1 text-white lg:text-3xl lg:font-bold lg:tracking-tight">
              <span className="ml-1.5" aria-hidden>
                {category.icon}
              </span>
              {category.name}
            </h1>
            <p className="wibe-small mt-1.5 line-clamp-2 text-white/90 lg:mt-2 lg:text-base lg:leading-relaxed">
              {category.description || 'بهترین لیست‌های سینمایی این هفته'}
            </p>

            <div className="mt-3 flex flex-wrap justify-end gap-2 lg:mt-4">
              <span className="rounded-lg bg-white/12 px-2.5 py-1 wibe-caption text-white/95 backdrop-blur-sm lg:px-3 lg:py-1.5 lg:text-sm">
                {metrics.viralCount > 0
                  ? `${metrics.viralCount.toLocaleString('fa-IR')} لیست ترند`
                  : `${metrics.totalLists.toLocaleString('fa-IR')} لیست فعال`}
              </span>
              <span className="rounded-lg bg-white/12 px-2.5 py-1 wibe-caption text-white/95 backdrop-blur-sm lg:px-3 lg:py-1.5 lg:text-sm">
                {metrics.totalItems.toLocaleString('fa-IR')} آیتم
              </span>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2 lg:mt-5">
              <Link
                href={`/lists?category=${category.slug}`}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 wibe-small font-semibold text-white transition-colors hover:bg-primary-dark lg:px-6 lg:text-sm"
              >
                کشف ترندها
              </Link>
              <Link
                href={`/lists?category=${category.slug}&create=1`}
                className="inline-flex items-center justify-center rounded-xl border border-white/45 px-5 py-2.5 wibe-small font-semibold text-white transition-colors hover:bg-white/10 lg:px-6 lg:text-sm"
              >
                ساخت لیست
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
