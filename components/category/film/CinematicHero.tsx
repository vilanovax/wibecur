'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getDisplayImageUrl } from '@/lib/display-image';
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
  const heroImage = category.heroImage
    ? getDisplayImageUrl(category.heroImage)
    : getRandomPlaceholderUrl(`hero-film-${category.slug}`, 'cover');

  return (
    <section className="relative mx-4 mt-4 overflow-hidden rounded-xl lg:mx-0 lg:mt-0 lg:rounded-2xl">
      <div className="relative aspect-[16/9] min-h-[220px] lg:aspect-[21/9] lg:min-h-[260px] lg:max-h-[340px]">
        <ImageWithFallback
          src={heroImage}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
          priority
          placeholderSize="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/25 lg:from-black/85 lg:via-black/40" />
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-l from-black/30 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5 lg:p-8 lg:pb-7">
          <h1 className="wibe-h1 text-white lg:text-3xl lg:font-bold lg:tracking-tight">
            {category.icon} {category.name}
          </h1>
          <p className="wibe-small text-white/90 mt-1 max-w-xl line-clamp-2 lg:mt-2 lg:text-base lg:leading-relaxed">
            {category.description || 'بهترین لیست‌های سینمایی این هفته'}
          </p>

          <div className="flex flex-wrap gap-2 mt-3 wibe-caption text-white/95 lg:mt-4 lg:gap-3">
            <span className="bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-md lg:px-3 lg:py-1.5 lg:text-sm">
              {metrics.viralCount > 0
                ? `${metrics.viralCount} لیست ترند`
                : `${metrics.totalLists} لیست فعال`}
            </span>
            <span className="bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-md lg:px-3 lg:py-1.5 lg:text-sm">
              {metrics.totalItems.toLocaleString('fa-IR')} آیتم
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 lg:mt-5 lg:gap-3">
            <Link
              href={`/lists?category=${category.slug}`}
              className="inline-flex items-center justify-center py-3 px-5 rounded-lg wibe-small font-semibold text-white bg-primary hover:bg-primary-dark transition-colors lg:py-2.5 lg:px-6 lg:text-sm"
            >
              کشف ترندها
            </Link>
            <Link
              href={`/lists?category=${category.slug}&create=1`}
              className="inline-flex items-center justify-center py-3 px-5 rounded-lg wibe-small font-semibold text-white border border-white/50 hover:bg-white/10 transition-colors lg:py-2.5 lg:px-6 lg:text-sm"
            >
              ساخت لیست
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
