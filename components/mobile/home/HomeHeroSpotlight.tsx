'use client';

import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import HomeHeroBannerLink from '@/components/mobile/home/HomeHeroBannerLink';
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
        className={`mb-3 mt-2 px-4 lg:mb-0 lg:mt-0 lg:px-0 ${fillHeight ? 'xl:flex xl:h-full xl:min-h-0 xl:flex-col' : ''}`}
        aria-hidden
      >
        <div
          className={`animate-pulse rounded-xl bg-gray-200 shadow-card lg:rounded-2xl ${
            fillHeight
              ? 'h-[200px] sm:h-[210px] xl:h-full xl:min-h-[18rem]'
              : 'h-[200px] sm:h-[210px] lg:h-[19rem] xl:h-[20rem]'
          }`}
        />
      </section>
    );
  }

  const categorySlug = list.categories?.slug ?? null;

  return (
    <section
      className={`mb-3 mt-2 px-4 lg:mb-0 lg:mt-0 lg:px-0 ${fillHeight ? 'xl:flex xl:h-full xl:min-h-0 xl:flex-col' : ''}`}
      aria-label="منتخب هفته"
    >
      <p className="mb-1.5 wibe-caption text-wibe-secondary lg:hidden">منتخب هفته</p>

      <HomeHeroBannerLink
        href={`/lists/${list.slug}`}
        listId={list.id}
        slotId={featuredSlotId}
        ariaLabel={`مشاهده لیست ${list.title}`}
        className={`group relative block overflow-hidden rounded-xl bg-gray-200 shadow-card sm:h-[210px] lg:rounded-2xl lg:shadow-lg ${
          fillHeight
            ? 'h-[200px] xl:h-full xl:min-h-[18rem]'
            : 'h-[200px] lg:h-[19rem] xl:h-[20rem]'
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
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] lg:object-[center_35%]"
          fallbackIcon={list.categories?.icon ?? '📚'}
          fallbackClassName="flex h-full w-full min-h-[200px] items-center justify-center bg-gray-200 text-5xl lg:min-h-0 lg:text-7xl"
          priority
          sizes={
            fillHeight
              ? '(max-width: 1279px) 100vw, 58vw'
              : '(max-width: 1023px) 100vw, (max-width: 1279px) 90vw, 58vw'
          }
        />

        {/* گرادیان — موبایل از پایین | دسکتاپ از راست (RTL) برای خوانایی تیتر */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent lg:bg-gradient-to-l lg:from-black/95 lg:via-black/70 lg:via-[45%] lg:to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-black/30 via-transparent to-black/10 lg:block"
          aria-hidden
        />

        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:max-w-[min(100%,34rem)] lg:justify-end lg:p-8 lg:pb-9 xl:max-w-[min(100%,38rem)] xl:p-10 xl:pb-11">
          <span
            className="mb-1.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 wibe-caption font-semibold text-white backdrop-blur-md lg:mb-3 lg:gap-2 lg:px-3.5 lg:py-1 lg:text-sm"
            aria-hidden
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 lg:h-4 lg:w-4" aria-hidden />
            منتخب هفته
          </span>

          <h2 className="line-clamp-2 text-h2 font-bold text-white lg:line-clamp-2 lg:text-3xl lg:leading-[1.15] xl:text-4xl xl:leading-[1.1]">
            {list.title}
          </h2>
        </div>
      </HomeHeroBannerLink>
    </section>
  );
}
