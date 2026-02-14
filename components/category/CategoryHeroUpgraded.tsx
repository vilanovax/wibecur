'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';
import { toAbsoluteImageUrl } from '@/lib/seo';

interface CategoryHeroUpgradedProps {
  category: CategoryInfo;
  metrics: CategoryMetrics;
  accentColor: string;
}

/** Hero تمام‌عرض با تصویر، گرادیان و CTA انسانی برای دسته‌های location-based */
export default function CategoryHeroUpgraded({
  category,
  metrics,
  accentColor,
}: CategoryHeroUpgradedProps) {
  return (
    <section className="relative -mx-4 -mt-4 mb-6">
      <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden">
        {category.heroImage ? (
          <>
            <ImageWithFallback
              src={toAbsoluteImageUrl(category.heroImage) || category.heroImage!}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor}60 0%, #1f2937 80%)`,
            }}
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            {category.icon} {category.name}
          </h1>
          <p className="text-base text-white/95 mt-2 drop-shadow-md">
            {category.description || 'بهترین تجربه‌های شهر'}
          </p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/95 font-medium">
            <span className="flex items-center gap-1.5">
              🔥 {metrics.totalLists} لیست فعال این هفته
            </span>
            <span className="flex items-center gap-1.5">
              📍 محبوب در تهران
            </span>
          </div>
          <Link
            href={`/lists?category=${category.slug}&create=1`}
            className="mt-5 inline-flex items-center justify-center w-full py-3.5 px-5 rounded-xl font-semibold text-base text-white transition-all active:scale-[0.98] shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            تجربه خودتو بساز
          </Link>
        </div>
      </div>
    </section>
  );
}
