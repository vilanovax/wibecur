import { Sparkles, ChevronLeft } from 'lucide-react';
import HomeHeroImpressionTracker from '@/components/mobile/home/HomeHeroClientActions';
import HomeHeroBannerLink from '@/components/mobile/home/HomeHeroBannerLink';
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
      <HomeHeroBannerLink
        href={`/lists/${list.slug}`}
        listId={list.id}
        slotId={slotId}
        ariaLabel={`مشاهده لیست ${list.title}`}
        className={`group relative block overflow-hidden rounded-2xl bg-gray-900 shadow-vibe-hero ring-1 ring-black/5 sm:h-[230px] lg:rounded-[1.35rem] lg:shadow-vibe-floating ${
          fillHeight
            ? 'h-[220px] xl:h-full xl:min-h-[20rem]'
            : 'h-[220px] lg:h-[21rem] xl:h-[22.5rem]'
        }`}
      >
        {heroSrc ? (
          <HeroCoverImage
            src={heroSrc}
            alt={list.title}
            priority
            sizes={sizes}
            fallbackIcon={list.categories?.icon ?? '📚'}
            categorySlug={categorySlug}
            listSlug={list.slug}
            listTitle={list.title}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04] lg:object-[center_35%]"
          />
        ) : (
          <div className="flex h-full w-full min-h-[220px] items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-5xl lg:min-h-0 lg:text-7xl">
            {list.categories?.icon ?? '📚'}
          </div>
        )}

        {/* عمق خوانایی — بدون بنفش؛ گرم از پایین / RTL از راست */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10 lg:bg-gradient-to-l lg:from-black lg:via-black/75 lg:via-[42%] lg:to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl"
          aria-hidden
        />

        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:max-w-[min(100%,36rem)] lg:p-8 lg:pb-9 xl:max-w-[min(100%,40rem)] xl:p-10 xl:pb-11">
          <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200/30 bg-amber-400/15 px-2.5 py-1 wibe-caption font-semibold text-amber-50 backdrop-blur-md lg:mb-3 lg:gap-2 lg:px-3.5 lg:py-1.5 lg:text-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 lg:h-4 lg:w-4" aria-hidden />
            منتخب هفته
          </span>

          <h2 className="line-clamp-2 text-balance text-h1 font-bold leading-[1.15] tracking-tight text-white sm:text-3xl lg:text-4xl lg:leading-[1.1] xl:text-h1">
            {list.title}
          </h2>

          {description ? (
            <p className="mt-2 line-clamp-2 max-w-xl text-pretty wibe-small leading-relaxed text-white/78 lg:mt-2.5 lg:text-base">
              {description}
            </p>
          ) : null}

          {metaParts.length > 0 ? (
            <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 wibe-caption text-white/65 tabular-nums lg:mt-3 lg:text-sm">
              {metaParts.map((part, i) => (
                <span key={part} className="inline-flex items-center gap-2">
                  {i > 0 ? <span aria-hidden className="text-white/35">·</span> : null}
                  {part}
                </span>
              ))}
            </p>
          ) : null}

          <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white/12 px-3 py-1.5 wibe-caption font-semibold text-white backdrop-blur-sm transition-colors group-hover:bg-white/20 lg:mt-4 lg:px-3.5 lg:py-2 lg:text-sm">
            مشاهده لیست
            <ChevronLeft className="h-3.5 w-3.5 rotate-180 lg:h-4 lg:w-4" aria-hidden />
          </span>

          <HomeHeroImpressionTracker slotId={slotId} />
        </div>
      </HomeHeroBannerLink>
    </section>
  );
}
