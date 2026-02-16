'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';
import { getDisplayImageUrl } from '@/lib/display-image';
import { getRandomPlaceholderUrl } from '@/lib/placeholder-images';

interface HubHeroV2Props {
  category: CategoryInfo;
  metrics: CategoryMetrics;
  accentColor: string;
}

/** Hero 3.0 — Local Explore Mode */
export default function HubHeroV2({
  category,
  metrics,
  accentColor = '#EA580C',
}: HubHeroV2Props) {
  const heroImage =
    category.heroImage
      ? getDisplayImageUrl(category.heroImage, 'covers')
      : getRandomPlaceholderUrl(`hero-${category.slug}`, 'cover');

  return (
    <section className="relative mx-4 mt-4 mb-4 overflow-hidden rounded-2xl">
      <div className="relative aspect-[4/3] min-h-[260px] overflow-hidden rounded-2xl">
        <ImageWithFallback
          src={heroImage}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover scale-105"
          priority
          placeholderSize="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />

        <div className="absolute inset-0 flex flex-col justify-end p-5 pb-5">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg tracking-tight">
            {category.icon} {category.name}
          </h1>
          <p className="text-sm text-white/90 mt-1 drop-shadow-md">
            {category.description || 'بهترین لیست‌های کافه و رستوران‌های شهر'}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4 text-sm text-white/95">
            <span>{metrics.totalItems} آیتم</span>
            <span>•</span>
            <span>{metrics.totalLists} لیست</span>
            {metrics.viralCount > 0 && (
              <>
                <span>•</span>
                <span>🔥 {metrics.viralCount} لیست وایرال این هفته</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <Link
              href={`/lists?category=${category.slug}&create=1`}
              className="flex-1 py-3.5 px-5 rounded-2xl font-bold text-base text-white text-center transition-all active:scale-[0.98] shadow-lg"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 16px ${accentColor}60`,
              }}
            >
              ساخت لیست در این دسته
            </Link>
            <Link
              href="#explore-by-city"
              className="py-3.5 px-4 rounded-2xl font-semibold text-sm text-white/95 border-2 border-white/50 backdrop-blur-sm text-center transition-all active:scale-[0.98] hover:bg-white/10"
            >
              📍 انتخاب شهر
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
