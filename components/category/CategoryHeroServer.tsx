import Link from 'next/link';
import Image from 'next/image';
import { getCategoryHeroDisplayUrl } from '@/lib/display-image';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import { isLocationCategorySlug } from '@/lib/category-layout';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';

type CategoryHeroServerProps = {
  category: CategoryInfo;
  metrics: CategoryMetrics;
};

export default function CategoryHeroServer({ category, metrics }: CategoryHeroServerProps) {
  const heroImage = getCategoryHeroDisplayUrl(category.heroImage, category.slug);
  const { src: heroSrc, unoptimized } = resolveNextImageSrc(heroImage);
  const showCityLink = isLocationCategorySlug(category.slug);

  return (
    <section className="relative mb-1 mt-3 overflow-hidden rounded-2xl lg:mt-4">
      <div className="relative aspect-[16/9] w-full min-h-[200px] overflow-hidden bg-neutral-950">
        {heroSrc ? (
          <Image
            src={heroSrc}
            alt={category.name}
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 1200px"
            className="object-cover object-center"
            unoptimized={unoptimized}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-6xl">
            {category.icon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5 text-right lg:p-6 lg:pb-6">
          <h1 className="wibe-h1 text-white lg:text-3xl">
            <span className="ml-1.5" aria-hidden>
              {category.icon}
            </span>
            {category.name}
          </h1>
          <p className="mt-1 line-clamp-2 wibe-small text-white/90 lg:text-base">
            {category.description || `بهترین لیست‌های ${category.name}`}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 wibe-caption text-white/95 lg:text-sm">
            <span>{metrics.totalLists.toLocaleString('fa-IR')} لیست</span>
            <span aria-hidden>·</span>
            <span>{metrics.totalItems.toLocaleString('fa-IR')} آیتم</span>
            {metrics.weeklySaveCount > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>{metrics.weeklySaveCount.toLocaleString('fa-IR')} ذخیره این هفته</span>
              </>
            )}
          </div>

          {showCityLink && (
            <div className="mt-4">
              <Link
                href="#explore-by-city"
                className="inline-flex items-center justify-center rounded-xl border border-white/40 px-4 py-3 wibe-small font-medium text-white/95 transition-colors hover:bg-white/10 sm:px-6"
              >
                انتخاب شهر
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
