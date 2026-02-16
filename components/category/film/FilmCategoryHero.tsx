'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';
import { getDisplayImageUrl } from '@/lib/display-image';
import { getRandomPlaceholderUrl } from '@/lib/placeholder-images';

interface FilmCategoryHeroProps {
  category: CategoryInfo;
  metrics: CategoryMetrics;
  accentColor: string;
}

/** Hero سینمایی فول اسکرین — Netflix + Letterboxd vibe */
export default function FilmCategoryHero({
  category,
  metrics,
  accentColor = '#8B5CF6',
}: FilmCategoryHeroProps) {
  return (
    <section className="relative -mx-4 mt-4 mb-8 overflow-hidden">
      <div className="relative aspect-[21/9] min-h-[220px] max-h-[45vh]">
        <ImageWithFallback
          src={
            category.heroImage
              ? getDisplayImageUrl(category.heroImage, 'covers')
              : getRandomPlaceholderUrl(`hero-film-${category.slug}`, 'cover')
          }
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
          priority
          placeholderSize="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-5 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">
            {category.icon} {category.name}
          </h1>
          <p className="text-base md:text-lg text-white/90 mt-2 max-w-xl drop-shadow-lg">
            {category.description || 'دنیای داستان‌ها و تجربه‌های مشترک'}
          </p>

          <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/95 font-medium">
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              🔥 {metrics.viralCount > 0 ? `${metrics.viralCount} لیست وایرال` : `${metrics.totalLists} لیست فعال`}
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              👥 {metrics.totalItems} آیتم
            </span>
          </div>

          <Link
            href={`/lists?category=${category.slug}&create=1`}
            className="mt-6 inline-flex items-center justify-center w-full max-w-xs py-4 px-6 rounded-xl font-bold text-base text-white transition-all active:scale-[0.98] shadow-xl"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 20px ${accentColor}50`,
            }}
          >
            🎥 لیست سینمایی خودتو بساز
          </Link>
        </div>
      </div>
    </section>
  );
}
