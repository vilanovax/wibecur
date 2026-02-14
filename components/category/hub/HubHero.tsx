'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';
import { toAbsoluteImageUrl } from '@/lib/seo';
import { getRandomPlaceholderUrl } from '@/lib/placeholder-images';

interface HubHeroProps {
  category: CategoryInfo;
  metrics: CategoryMetrics;
  accentColor: string;
}

/** Hero حرفه‌ای — تصویر بزرگ، ۳ آمار، دو CTA */
export default function HubHero({
  category,
  metrics,
  accentColor = '#EA580C',
}: HubHeroProps) {
  const heroImage =
    category.heroImage
      ? (toAbsoluteImageUrl(category.heroImage) || category.heroImage)
      : getRandomPlaceholderUrl(`hero-${category.slug}`, 'cover');

  return (
    <section className="relative -mx-4 -mt-4 mb-4">
      <div className="relative aspect-[4/3] min-h-[240px] overflow-hidden">
        <ImageWithFallback
          src={heroImage}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
          priority
          placeholderSize="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/50 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-end p-5 pb-5">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">
            {category.icon} {category.name}
          </h1>
          <p className="text-sm text-white/90 mt-1 drop-shadow-md">
            {category.description || 'بهترین تجربه‌های شهر'}
          </p>

          {/* ۳ آمار زنده + Social Proof */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-white/60">
                لیست فعال
              </span>
              <span className="text-xl font-bold text-white tabular-nums">
                {metrics.totalLists}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-white/60">
                کیوریتور فعال
              </span>
              <span className="text-xl font-bold text-white tabular-nums">
                {metrics.totalCuratorsCount ?? 0}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-white/60">
                ذخیره این هفته
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-white tabular-nums">
                  {metrics.weeklySaveCount}
                </span>
                {typeof metrics.weeklyGrowthPercent === 'number' &&
                  metrics.weeklyGrowthPercent !== 0 && (
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        metrics.weeklyGrowthPercent > 0
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-red-500/80 text-white'
                      }`}
                    >
                      {metrics.weeklyGrowthPercent > 0 ? '↑' : '↓'}{' '}
                      {Math.abs(metrics.weeklyGrowthPercent)}%
                    </span>
                  )}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Link
              href={`/lists?category=${category.slug}&create=1`}
              className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-sm text-white text-center transition-all active:scale-[0.98] shadow-lg"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 14px ${accentColor}50`,
              }}
            >
              ساخت لیست در این دسته
            </Link>
            <Link
              href={`/lists?category=${category.slug}&sort=popular`}
              className="py-3.5 px-4 rounded-2xl font-semibold text-sm text-white/95 border-2 border-white/40 backdrop-blur-sm text-center transition-all active:scale-[0.98]"
            >
              مرور محبوب‌ترین‌ها
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
