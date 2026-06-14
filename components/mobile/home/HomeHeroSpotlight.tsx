'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Eye, Sparkles } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import { useHomeData } from '@/contexts/HomeDataContext';

function trackFeaturedClick(slotId: string, listId: string, action: 'view_list' | 'quick_save') {
  try {
    fetch('/api/home-featured/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, listId, action }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

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

export default function HomeHeroSpotlight() {
  const { data, isLoading } = useHomeData();
  const list = data?.featured ?? null;
  const featuredSlotId = data?.featuredSlotId ?? null;

  useEffect(() => {
    if (featuredSlotId) trackFeaturedImpressionOnce(featuredSlotId);
  }, [featuredSlotId]);

  if (isLoading || !list) {
    if (!isLoading && !list) return null;
    return (
      <section className="mb-4 mt-3 px-4 lg:mb-0 lg:mt-0 lg:px-0" aria-hidden>
        <div className="h-[240px] animate-pulse rounded-xl bg-gray-200 shadow-card sm:h-[260px] lg:h-[26rem] lg:rounded-2xl xl:h-[30rem]" />
      </section>
    );
  }

  const creator = list.creator;
  const heroImage = list.bannerImage ?? list.coverImage;

  return (
    <section className="mb-4 mt-3 px-4 lg:mb-0 lg:mt-0 lg:px-0" aria-label="منتخب هفته">
      <p className="mb-2 wibe-caption text-wibe-secondary lg:hidden">منتخب هفته</p>

      <div className="group relative h-[240px] overflow-hidden rounded-xl bg-gray-200 shadow-card sm:h-[260px] lg:h-[26rem] lg:rounded-2xl lg:shadow-lg xl:h-[30rem]">
        <ImageWithFallback
          src={heroImage}
          alt={list.title}
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] lg:object-[center_35%]"
          fallbackIcon={list.categories?.icon ?? '📚'}
          fallbackClassName="flex h-full w-full min-h-[240px] items-center justify-center bg-gray-200 text-5xl lg:min-h-0 lg:text-7xl"
          categorySlug={list.categories?.slug}
          listSlug={list.slug}
          listTitle={list.title}
          priority
          sizes="100vw"
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

        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 lg:max-w-[min(100%,34rem)] lg:justify-end lg:p-8 lg:pb-9 xl:max-w-[min(100%,38rem)] xl:p-10 xl:pb-11">
          <span
            className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 wibe-caption font-semibold text-white backdrop-blur-md lg:mb-3 lg:gap-2 lg:px-3.5 lg:py-1 lg:text-sm"
            aria-hidden
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 lg:h-4 lg:w-4" aria-hidden />
            منتخب هفته
          </span>

          <h2 className="line-clamp-2 text-h2 font-bold leading-tight text-white lg:line-clamp-3 lg:text-4xl lg:leading-[1.15] xl:text-5xl xl:leading-[1.1]">
            {list.title}
          </h2>
          {list.description && (
            <p className="mt-2 line-clamp-2 wibe-small leading-relaxed text-white/90 lg:mt-3 lg:line-clamp-2 lg:text-base lg:leading-relaxed xl:mt-4 xl:text-lg xl:leading-8">
              {list.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 wibe-caption text-white/85 lg:mt-3 lg:text-sm xl:mt-4">
            {creator?.name && <span>از {creator.name}</span>}
            {(list.saveCount ?? 0) > 0 && (
              <span>
                {(list.saveCount ?? 0).toLocaleString('fa-IR')} ذخیره
              </span>
            )}
          </div>

          <div className="mt-4 flex gap-2.5 sm:gap-3 lg:mt-6 lg:gap-3 xl:mt-7">
            <Link
              href={`/lists/${list.slug}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/20 py-3 wibe-small font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 active:scale-[0.99] lg:flex-none lg:border-primary lg:bg-primary lg:px-6 lg:py-3 lg:text-base lg:shadow-md lg:hover:bg-primary-dark"
              onClick={() => {
                if (featuredSlotId && list.id) trackFeaturedClick(featuredSlotId, list.id, 'view_list');
              }}
            >
              <Eye className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" />
              مشاهده
            </Link>
            <div className="min-w-0 flex-1 lg:w-auto lg:flex-none lg:min-w-[9.5rem]">
              <BookmarkButton
                listId={list.id}
                initialBookmarkCount={list.saveCount}
                variant="button"
                size="md"
                tone="secondary"
                labelSave="ذخیره"
                labelSaved="ذخیره شد ✓"
                className="lg:!w-auto lg:min-w-[9.5rem] lg:rounded-lg lg:py-3 lg:text-base"
                onToggle={(saved) => {
                  if (saved && featuredSlotId && list.id) {
                    trackFeaturedClick(featuredSlotId, list.id, 'quick_save');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
