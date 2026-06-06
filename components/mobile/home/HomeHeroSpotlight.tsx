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
        <div className="h-[240px] animate-pulse rounded-xl bg-gray-200 shadow-card sm:h-[260px] lg:grid lg:min-h-[260px] lg:grid-cols-2 lg:rounded-2xl lg:overflow-hidden">
          <div className="bg-gray-200" />
          <div className="hidden bg-gray-100 lg:block" />
        </div>
      </section>
    );
  }

  const creator = list.creator;

  return (
    <section className="mb-4 mt-3 px-4 lg:mb-0 lg:mt-0 lg:px-0" aria-label="منتخب هفته">
      <p className="mb-2 wibe-caption text-wibe-secondary lg:hidden">منتخب هفته</p>

      <div className="relative h-[240px] overflow-hidden rounded-xl bg-gray-200 shadow-card sm:h-[260px] lg:grid lg:h-auto lg:min-h-[260px] lg:grid-cols-2 lg:rounded-2xl lg:border lg:border-wibe lg:shadow-md">
        {/* تصویر — ستون راست در RTL */}
        <div className="absolute inset-0 lg:relative lg:min-h-[260px]">
          <ImageWithFallback
            src={list.bannerImage ?? list.coverImage}
            alt={list.title}
            className="absolute inset-0 h-full w-full object-cover object-center lg:static lg:min-h-[260px]"
            fallbackIcon={list.categories?.icon ?? '📚'}
            fallbackClassName="flex h-full w-full min-h-[240px] items-center justify-center bg-gray-200 text-5xl lg:min-h-[260px] lg:text-6xl"
            categorySlug={list.categories?.slug}
            listSlug={list.slug}
            listTitle={list.title}
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent lg:hidden"
            aria-hidden
          />
        </div>

        {/* متن — موبایل روی تصویر | دسکتاپ پنل کنار تصویر */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 lg:relative lg:justify-center lg:bg-wibe-card lg:p-6 lg:text-right lg:pe-7">
          <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 wibe-caption font-semibold text-white backdrop-blur-md lg:border-primary/20 lg:bg-primary/10 lg:text-primary">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 lg:text-primary" aria-hidden />
            منتخب هفته
          </span>

          <h2 className="line-clamp-2 text-h2 font-bold leading-tight text-white lg:text-2xl lg:text-foreground xl:text-[1.625rem]">
            {list.title}
          </h2>
          {list.description && (
            <p className="mt-2 line-clamp-2 wibe-small leading-relaxed text-white/90 lg:mt-2.5 lg:text-wibe-secondary lg:line-clamp-3">
              {list.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 wibe-caption text-white/75 lg:mt-3 lg:text-wibe-secondary">
            {creator?.name && <span>از {creator.name}</span>}
            {(list.saveCount ?? 0) > 0 && (
              <span>
                {(list.saveCount ?? 0).toLocaleString('fa-IR')} ذخیره
              </span>
            )}
          </div>

          <div className="mt-4 flex gap-2.5 sm:gap-3 lg:mt-5">
            <Link
              href={`/lists/${list.slug}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/20 py-3 wibe-small font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 active:scale-[0.99] lg:flex-none lg:border-wibe lg:bg-wibe-surface lg:px-5 lg:py-2.5 lg:text-foreground lg:hover:bg-gray-50"
              onClick={() => {
                if (featuredSlotId && list.id) trackFeaturedClick(featuredSlotId, list.id, 'view_list');
              }}
            >
              <Eye className="h-4 w-4 shrink-0" />
              مشاهده
            </Link>
            <div className="min-w-0 flex-1 lg:w-auto lg:flex-none lg:min-w-[8.5rem]">
              <BookmarkButton
                listId={list.id}
                initialBookmarkCount={list.saveCount}
                variant="button"
                size="md"
                labelSave="ذخیره"
                labelSaved="ذخیره شد ✓"
                className="lg:!w-auto lg:min-w-[8.5rem] lg:py-2.5"
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
