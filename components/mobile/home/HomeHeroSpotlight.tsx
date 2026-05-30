'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Bookmark, Eye } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
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
      <section className="px-4 mt-4 mb-6">
        <div className="rounded-lg h-[240px] bg-gray-200 animate-pulse shadow-card" />
      </section>
    );
  }

  const creator = list.creator;

  return (
    <section className="px-4 mt-4 mb-6">
      <p className="wibe-caption text-wibe-secondary mb-2">منتخب هفته</p>
      <div className="relative rounded-lg overflow-hidden h-[240px] bg-gray-200 shadow-card">
        <ImageWithFallback
          src={list.coverImage}
          alt={list.title}
          className="absolute inset-0 w-full h-full object-cover"
          fallbackIcon="🎬"
          fallbackClassName="w-full h-full flex items-center justify-center text-5xl bg-gray-200"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-h2 font-bold text-white line-clamp-2">{list.title}</h1>
          {list.description && (
            <p className="wibe-small text-white/90 mt-2 line-clamp-2">{list.description}</p>
          )}
          {creator?.name && (
            <p className="wibe-caption text-white/70 mt-1.5">از {creator.name}</p>
          )}
          <div className="flex gap-3 mt-4">
            <Link
              href={`/lists/${list.slug}`}
              className="flex-1 py-3 rounded-md bg-wibe-card text-foreground font-semibold wibe-small text-center flex items-center justify-center gap-2"
              onClick={() => {
                if (featuredSlotId && list.id) trackFeaturedClick(featuredSlotId, list.id, 'view_list');
              }}
            >
              <Eye className="w-4 h-4" />
              مشاهده
            </Link>
            <Link
              href={`/lists/${list.slug}`}
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-md bg-primary text-white font-semibold wibe-small"
              aria-label="ذخیره لیست"
              onClick={() => {
                if (featuredSlotId && list.id) trackFeaturedClick(featuredSlotId, list.id, 'quick_save');
              }}
            >
              <Bookmark className="w-4 h-4" />
              ذخیره
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
