'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';
import { getDisplayImageUrl } from '@/lib/display-image';
import { getRandomPlaceholderUrl } from '@/lib/placeholder-images';

interface CategoryHeroProps {
  category: CategoryInfo;
  metrics: CategoryMetrics;
  layoutType: 'cinematic' | 'locationBased' | 'minimal' | 'editorial';
}

export default function CategoryHero({
  category,
  metrics,
  layoutType,
}: CategoryHeroProps) {
  const isCinematic = layoutType === 'cinematic';

  const heroContent = (
    <div
      className={`relative overflow-hidden rounded-lg ${
        isCinematic ? 'aspect-video min-h-[180px]' : 'aspect-[16/9] min-h-[140px]'
      }`}
    >
      <ImageWithFallback
        src={
          category.heroImage
            ? getDisplayImageUrl(category.heroImage)
            : getRandomPlaceholderUrl(`hero-${category.slug}`, 'cover')
        }
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover"
        priority
      />
      <div
        className={`absolute inset-0 ${
          isCinematic
            ? 'bg-gradient-to-t from-black/90 via-black/50 to-black/30'
            : 'bg-gradient-to-t from-black/70 via-black/40 to-transparent'
        }`}
      />

      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <h1 className="wibe-h1 text-white">{category.name}</h1>
        {category.description && (
          <p className="wibe-small text-white/90 mt-1 line-clamp-2">{category.description}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-3 wibe-caption text-white/90">
          <span>{metrics.totalLists.toLocaleString('fa-IR')} لیست</span>
          <span>·</span>
          <span>{metrics.totalItems.toLocaleString('fa-IR')} آیتم</span>
          {metrics.weeklySaveCount > 0 && (
            <>
              <span>·</span>
              <span>{metrics.weeklySaveCount.toLocaleString('fa-IR')} ذخیره این هفته</span>
            </>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Link
            href={`/lists?category=${category.slug}&create=1`}
            className="px-4 py-2 rounded-md wibe-small font-semibold text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            ساخت لیست در این دسته
          </Link>
        </div>
      </div>
    </div>
  );

  return <section className="px-4 pt-4 pb-2">{heroContent}</section>;
}
