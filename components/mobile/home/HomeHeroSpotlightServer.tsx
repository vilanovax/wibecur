import { Sparkles, ChevronLeft } from 'lucide-react';
import HomeHeroImpressionTracker from '@/components/mobile/home/HomeHeroClientActions';
import HomeHeroBannerLink from '@/components/mobile/home/HomeHeroBannerLink';
import HomeHeroSaveButton from '@/components/mobile/home/HomeHeroSaveButton';
import HeroCoverImage from '@/components/shared/HeroCoverImage';
import { resolveListBannerImage } from '@/lib/list-display-images';
import type { FeaturedListData } from '@/types/home-data';

type HomeHeroSpotlightServerProps = {
  list: FeaturedListData;
  slotId: string | null;
  fillHeight?: boolean;
};

function resolveFeaturedHeroSrc(list: FeaturedListData): string {
  return (
    list.bannerImage?.trim() ||
    resolveListBannerImage({
      coverImage: list.coverImage,
      horizontalImage: list.horizontalImage,
      slug: list.slug,
      title: list.title,
      categorySlug: list.categories?.slug,
    }) ||
    list.coverImage ||
    ''
  );
}

export default function HomeHeroSpotlightServer({
  list,
  slotId,
  fillHeight = false,
}: HomeHeroSpotlightServerProps) {
  const heroSrc = resolveFeaturedHeroSrc(list);
  const categorySlug = list.categories?.slug ?? null;
  const sizes = fillHeight
    ? '(max-width: 1279px) 100vw, 58vw'
    : '(max-width: 1023px) 100vw, (max-width: 1279px) 90vw, 58vw';
  const description = list.description?.trim() ?? '';
  const metaParts = [
    list.itemCount > 0 ? `${list.itemCount.toLocaleString('fa-IR')} آیتم` : null,
    list.saveCount > 0 ? `${list.saveCount.toLocaleString('fa-IR')} ذخیره` : null,
    list.categories?.name ?? null,
  ].filter(Boolean);

  return (
    <section
      className={`mb-4 mt-1 px-4 lg:mb-0 lg:mt-0 lg:px-0 ${fillHeight ? 'xl:flex xl:h-full xl:min-h-0 xl:flex-col' : ''}`}
      aria-label="منتخب هفته"
    >
      <div className={`relative ${fillHeight ? 'xl:flex xl:h-full xl:min-h-0 xl:flex-col' : ''}`}>
      <HomeHeroBannerLink
        href={`/lists/${list.slug}`}
        listId={list.id}
        slotId={slotId}
        ariaLabel={`مشاهده لیست ${list.title}`}
        className={`group relative block overflow-hidden rounded-xl bg-foreground shadow-vibe-hero ring-1 ring-foreground/10 sm:h-60 ${
          fillHeight
            ? 'h-56 xl:h-full xl:min-h-80'
            : 'h-56 lg:h-80 xl:h-96'
        }`}
      >
        {heroSrc ? (
          <HeroCoverImage
            src={heroSrc}
            alt={list.title}
            // هیرو دسکتاپ (fillHeight) در موبایل display:none است؛ priority آنجا پهنای باند LCP را می‌دزدد
            priority={!fillHeight}
            sizes={sizes}
            fallbackIcon={list.categories?.icon ?? '📚'}
            categorySlug={categorySlug}
            listSlug={list.slug}
            listTitle={list.title}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04] lg:object-[center_35%]"
          />
        ) : (
          <div className="pointer-events-none flex h-full w-full min-h-56 items-center justify-center bg-foreground text-5xl lg:min-h-0">
            {list.categories?.icon ?? '📚'}
          </div>
        )}

        {/* عمق خوانایی — بدون بنفش؛ گرم از پایین / RTL از راست */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground via-foreground/55 to-foreground/10 lg:bg-linear-to-l lg:from-foreground lg:via-foreground/75 lg:via-42% lg:to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-foreground/35 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 flex h-full flex-col justify-end p-4 sm:p-5 lg:max-w-xl lg:p-8 lg:pb-8 xl:max-w-2xl">
          <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-background/40 bg-background/10 px-3 py-1 text-xs font-semibold text-background backdrop-blur-md">
            <Sparkles className="size-4" aria-hidden />
            منتخب هفته
          </span>

          <h2 className="line-clamp-2 text-balance text-h1 font-bold leading-tight text-background">
            {list.title}
          </h2>

          {description ? (
            <p className="mt-1.5 line-clamp-2 text-pretty wibe-small leading-relaxed text-background/90 lg:mt-2.5 lg:line-clamp-2 lg:text-base">
              {description}
            </p>
          ) : null}

          {metaParts.length > 0 ? (
            <p className="mt-2 hidden flex-wrap items-center gap-x-2 gap-y-1 wibe-caption text-background/80 tabular-nums sm:flex lg:mt-3 lg:text-sm">
              {metaParts.map((part, i) => (
                <span key={part} className="inline-flex items-center gap-2">
                  {i > 0 ? <span aria-hidden className="text-background/45">·</span> : null}
                  {part}
                </span>
              ))}
            </p>
          ) : null}

          <span className="mt-3 inline-flex h-11 w-fit items-center gap-1 rounded-full bg-background/15 px-4 text-sm font-semibold text-background backdrop-blur-sm transition-colors group-hover:bg-background/25">
            مشاهده لیست
            <ChevronLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" aria-hidden />
          </span>

          <HomeHeroImpressionTracker slotId={slotId} />
        </div>
      </HomeHeroBannerLink>
      <HomeHeroSaveButton
        listId={list.id}
        listSlug={list.slug}
        categorySlug={categorySlug}
        saveCount={list.saveCount}
      />
      </div>
    </section>
  );
}
