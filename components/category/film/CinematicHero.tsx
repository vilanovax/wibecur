'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';
import { toAbsoluteImageUrl } from '@/lib/seo';
import { getRandomPlaceholderUrl } from '@/lib/placeholder-images';

interface CinematicHeroProps {
  category: CategoryInfo;
  metrics: CategoryMetrics;
}

const GOLD = '#F5C36A';

/** Hero سینمایی فول‌بلید — Netflix-style، گرادیان تیره، CTA طلایی */
export default function CinematicHero({
  category,
  metrics,
}: CinematicHeroProps) {
  const heroImage =
    category.heroImage
      ? (toAbsoluteImageUrl(category.heroImage) || category.heroImage)
      : getRandomPlaceholderUrl(`hero-film-${category.slug}`, 'cover');

  return (
    <section className="relative mx-4 mt-4 overflow-hidden rounded-2xl">
      <div className="relative aspect-[16/9] min-h-[240px]">
        <ImageWithFallback
          src={heroImage}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover scale-105"
          priority
          placeholderSize="cover"
        />
        {/* گرادیان تیره ۶۰٪ پایین */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-5 pb-7">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">
            {category.icon} {category.name}
          </h1>
          <p className="text-base md:text-lg text-white/90 mt-2 max-w-xl drop-shadow-lg">
            {category.description || 'بهترین لیست‌های سینمایی این هفته'}
          </p>

          <div className="flex flex-wrap gap-3 mt-5 text-sm text-white/95">
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              🔥 {metrics.viralCount > 0 ? `${metrics.viralCount} لیست وایرال` : `${metrics.totalLists} لیست فعال`}
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              🎭 {(metrics as { genreCount?: number }).genreCount ?? 14} ژانر فعال
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              🎞 {metrics.totalItems} آیتم
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href={`/lists?category=${category.slug}`}
              className="inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-base text-gray-900 transition-all active:scale-[0.98] shadow-xl"
              style={{
                backgroundColor: GOLD,
                boxShadow: `0 4px 20px ${GOLD}60`,
              }}
            >
              ▶ کشف ترندها
            </Link>
            <Link
              href={`/lists?category=${category.slug}&create=1`}
              className="inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-base text-white border-2 border-white/60 hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              ✍ ساخت لیست سینمایی
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
