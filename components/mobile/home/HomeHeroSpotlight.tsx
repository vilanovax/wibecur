'use client';

import { useEffect } from 'react';
import { Sparkles, ChevronLeft } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import HomeHeroBannerLink from '@/components/mobile/home/HomeHeroBannerLink';
import HomeHeroSaveButton from '@/components/mobile/home/HomeHeroSaveButton';
import { useHomeData } from '@/contexts/HomeDataContext';

function trackFeaturedImpressionOnce(slotId: string) {
  try {
    const key = `featured_impression_${slotId}`;
    if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      fetch('/api/home-featured/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

export default function HomeHeroSpotlight({ fillHeight = false }: { fillHeight?: boolean }) {
  const { data, isLoading } = useHomeData();
  const list = data?.featured ?? null;
  const featuredSlotId = data?.featuredSlotId ?? null;

  useEffect(() => {
    if (featuredSlotId) trackFeaturedImpressionOnce(featuredSlotId);
  }, [featuredSlotId]);

  if (isLoading || !list) {
    if (!isLoading && !list) return null;
    return (
      <section
        className={`mb-4 mt-1 px-4 lg:mb-0 lg:mt-0 lg:px-0 ${fillHeight ? 'xl:flex xl:h-full xl:min-h-0 xl:flex-col' : ''}`}
        aria-hidden
      >
        <div
          className={`animate-pulse-soft rounded-xl bg-muted shadow-vibe-hero ${
            fillHeight
              ? 'h-56 sm:h-60 xl:h-full xl:min-h-80'
              : 'h-56 sm:h-60 lg:h-80 xl:h-96'
          }`}
        />
      </section>
    );
  }

  const categorySlug = list.categories?.slug ?? null;
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
        slotId={featuredSlotId}
        ariaLabel={`مشاهده لیست ${list.title}`}
        className={`group relative block overflow-hidden rounded-xl bg-foreground shadow-vibe-hero ring-1 ring-foreground/10 sm:h-60 ${
          fillHeight
            ? 'h-56 xl:h-full xl:min-h-80'
            : 'h-56 lg:h-80 xl:h-96'
        }`}
      >
        <ListCoverImage
          variant="banner"
          bannerImage={list.bannerImage}
          horizontalImage={list.horizontalImage}
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04] lg:object-[center_35%]"
          fallbackIcon={list.categories?.icon ?? '📚'}
          fallbackClassName="pointer-events-none flex h-full w-full min-h-56 items-center justify-center bg-foreground text-5xl lg:min-h-0"
          priority
          sizes={
            fillHeight
              ? '(max-width: 1279px) 100vw, 58vw'
              : '(max-width: 1023px) 100vw, (max-width: 1279px) 90vw, 58vw'
          }
        />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10 lg:bg-gradient-to-l lg:from-black lg:via-black/75 lg:via-[42%] lg:to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent"
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
            <p className="mt-1.5 line-clamp-2 text-pretty wibe-small leading-relaxed text-background/90 lg:mt-2.5 lg:text-base">
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
