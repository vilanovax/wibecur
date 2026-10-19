import Link from 'next/link';
import HeroCoverImage from '@/components/shared/HeroCoverImage';
import { getCategoryHeroDisplayUrl } from '@/lib/display-image';
import { isFilmCategorySlug, isLocationCategorySlug } from '@/lib/category-layout';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';

type CategoryHeroServerProps = {
  category: CategoryInfo;
  metrics: CategoryMetrics;
};

export default function CategoryHeroServer({ category, metrics }: CategoryHeroServerProps) {
  const heroImage = getCategoryHeroDisplayUrl(category.heroImage, category.slug);
  const showCityLink = isLocationCategorySlug(category.slug);
  const isFilm = isFilmCategorySlug(category.slug);

  return (
    <section className="relative mb-1 mt-3 overflow-hidden rounded-2xl shadow-vibe-hero ring-1 ring-black/5 lg:mt-4">
      <div className="relative aspect-[16/9] w-full min-h-[200px] overflow-hidden bg-neutral-900 sm:min-h-[220px]">
        <HeroCoverImage
          src={heroImage}
          alt={category.name}
          priority
          sizes="(max-width: 1023px) 100vw, 1200px"
          fallbackIcon={category.icon ?? (isFilm ? '🎬' : '📚')}
          categorySlug={category.slug}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-black/10" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5 text-start lg:p-6 lg:pb-6">
          <h1 className="wibe-h1 text-white drop-shadow-sm">
            <span className="ms-1.5" aria-hidden>
              {category.icon}
            </span>
            {category.name}
          </h1>
          <p className="mt-1.5 line-clamp-2 wibe-small leading-relaxed text-white/90">
            {category.description || `بهترین لیست‌های ${category.name}`}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 wibe-caption font-medium text-white/95 backdrop-blur-sm tabular-nums">
              {metrics.totalLists.toLocaleString('fa-IR')} لیست
            </span>
            <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 wibe-caption font-medium text-white/95 backdrop-blur-sm tabular-nums">
              {metrics.totalItems.toLocaleString('fa-IR')} آیتم
            </span>
            {metrics.weeklySaveCount > 0 && (
              <span className="inline-flex rounded-full bg-warning/90 px-2.5 py-1 wibe-caption font-semibold text-white tabular-nums">
                {metrics.weeklySaveCount.toLocaleString('fa-IR')} ذخیره این هفته
              </span>
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
