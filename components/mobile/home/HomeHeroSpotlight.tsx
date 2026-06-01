'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Eye } from 'lucide-react';
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
      <section className="mb-6 mt-4 px-4 lg:px-0">
        <div className="h-[240px] animate-pulse rounded-lg bg-gray-200 shadow-card lg:h-[300px]" />
      </section>
    );
  }

  const creator = list.creator;

  return (
    <section className="mb-6 mt-4 px-4 lg:px-0">
      <p className="mb-2 wibe-caption text-wibe-secondary">منتخب هفته</p>
      <div className="relative h-[240px] overflow-hidden rounded-lg bg-gray-200 shadow-card lg:h-[300px] xl:h-[320px]">
        <ImageWithFallback
          src={list.coverImage}
          alt={list.title}
          className="absolute inset-0 h-full w-full object-cover"
          fallbackIcon={list.categories?.icon ?? '📚'}
          fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-5xl"
          categorySlug={list.categories?.slug}
          listSlug={list.slug}
          listTitle={list.title}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-5 text-right">
          <h1 className="line-clamp-2 text-h2 font-bold text-white">{list.title}</h1>
          {list.description && (
            <p className="mt-2 line-clamp-2 wibe-small text-white/90">{list.description}</p>
          )}
          {creator?.name && (
            <p className="mt-1.5 wibe-caption text-white/70">از {creator.name}</p>
          )}
          <div className="mt-4 flex gap-3">
            <Link
              href={`/lists/${list.slug}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-wibe-card py-3 text-center wibe-small font-semibold text-foreground"
              onClick={() => {
                if (featuredSlotId && list.id) trackFeaturedClick(featuredSlotId, list.id, 'view_list');
              }}
            >
              <Eye className="h-4 w-4" />
              مشاهده
            </Link>
            <div className="flex-1 min-w-0">
              <BookmarkButton
                listId={list.id}
                initialBookmarkCount={list.saveCount}
                variant="button"
                size="lg"
                labelSave="ذخیره"
                labelSaved="ذخیره شد ✓"
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
