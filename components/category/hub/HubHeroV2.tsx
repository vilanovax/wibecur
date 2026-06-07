'use client';

import Link from 'next/link';
import CategoryHeroMedia from '@/components/category/CategoryHeroMedia';
import { getCategoryHeroDisplayUrl } from '@/lib/display-image';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';

interface HubHeroV2Props {
  category: CategoryInfo;
  metrics: CategoryMetrics;
  accentColor: string;
}

export default function HubHeroV2({
  category,
  metrics,
}: HubHeroV2Props) {
  const heroImage = getCategoryHeroDisplayUrl(category.heroImage, category.slug);

  return (
    <section className="relative mb-2 mt-3 overflow-hidden rounded-2xl">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-950 min-h-[200px]">
        <CategoryHeroMedia src={heroImage} alt={category.name} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 text-right pb-5">
          <h1 className="wibe-h1 text-white">
            {category.icon} {category.name}
          </h1>
          <p className="wibe-small text-white/90 mt-1">
            {category.description || 'بهترین لیست‌های کافه و رستوران‌های شهر'}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 wibe-caption text-white/95">
            <span>{metrics.totalItems.toLocaleString('fa-IR')} آیتم</span>
            <span>·</span>
            <span>{metrics.totalLists.toLocaleString('fa-IR')} لیست</span>
            {metrics.viralCount > 0 && (
              <>
                <span>·</span>
                <span>{metrics.viralCount} لیست ترند این هفته</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link
              href={`/lists?category=${category.slug}&create=1`}
              className="flex-1 py-3 px-4 rounded-md wibe-small font-semibold text-white text-center bg-primary hover:bg-primary-dark transition-colors"
            >
              ساخت لیست در این دسته
            </Link>
            <Link
              href="#explore-by-city"
              className="py-3 px-4 rounded-md wibe-small font-medium text-white/95 border border-white/40 text-center hover:bg-white/10 transition-colors"
            >
              انتخاب شهر
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
