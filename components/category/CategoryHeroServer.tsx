import Link from 'next/link';
import HeroCoverImage from '@/components/shared/HeroCoverImage';
import { getCategoryHeroDisplayUrl } from '@/lib/display-image';
import { isLocationCategorySlug } from '@/lib/category-layout';
import type { CategoryInfo, CategoryMetrics } from '@/types/category-page';

type CategoryHeroServerProps = {
  category: CategoryInfo;
  metrics: CategoryMetrics;
};

export default function CategoryHeroServer({ category, metrics }: CategoryHeroServerProps) {
  const heroImage = getCategoryHeroDisplayUrl(category.heroImage, category.slug);
  const showCityLink = isLocationCategorySlug(category.slug);

  return (
    <section className="relative mb-1 mt-3 overflow-hidden rounded-xl lg:mt-4">
      <div className="relative aspect-video w-full min-h-52 overflow-hidden bg-foreground">
        <HeroCoverImage
          src={heroImage}
          alt={category.name}
          priority
          sizes="(max-width: 1023px) 100vw, 1200px"
          fallbackIcon={category.icon ?? '📚'}
          categorySlug={category.slug}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5 text-start lg:p-6 lg:pb-6">
          <h1 className="wibe-h1 text-background lg:text-3xl">
            <span className="me-1.5" aria-hidden>
              {category.icon}
            </span>
            {category.name}
          </h1>
          <p className="mt-1 line-clamp-2 wibe-small text-background/90 lg:text-base">
            {category.description || `بهترین لیست‌های ${category.name}`}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 wibe-caption text-background/95 lg:text-sm">
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
                className="inline-flex h-12 items-center justify-center rounded-control border border-background/40 px-4 text-sm font-medium text-background/95 transition-colors hover:bg-background/10"
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
