'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Eye } from 'lucide-react';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import { trackFeaturedHeroClick } from '@/lib/analytics';
import type { FeaturedListData } from '@/types/home-data';

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

type HomeHeroClientActionsProps = {
  list: FeaturedListData;
  slotId: string | null;
};

export default function HomeHeroClientActions({ list, slotId }: HomeHeroClientActionsProps) {
  useEffect(() => {
    if (slotId) trackFeaturedImpressionOnce(slotId);
  }, [slotId]);

  const categorySlug = list.categories?.slug;

  return (
    <div className="mt-3 flex gap-2.5 sm:mt-4 sm:gap-3 lg:mt-6 lg:gap-3 xl:mt-7">
      <Link
        href={`/lists/${list.slug}`}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/20 py-3 wibe-small font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 active:scale-[0.99] lg:flex-none lg:border-primary lg:bg-primary lg:px-6 lg:py-3 lg:text-base lg:shadow-md lg:hover:bg-primary-dark"
        onClick={() => {
          trackFeaturedHeroClick({
            list_slug: list.slug,
            category_slug: categorySlug,
            action: 'view',
            slot_id: slotId ?? undefined,
          });
          if (slotId && list.id) trackFeaturedClick(slotId, list.id, 'view_list');
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
          showCount={false}
          labelSave="ذخیره"
          labelSaved="ذخیره شد ✓"
          className="lg:!w-auto lg:min-w-[9.5rem] lg:rounded-lg lg:py-3 lg:text-base"
          analytics={{
            listSlug: list.slug,
            categorySlug,
            source: 'featured_hero',
          }}
          onToggle={(saved) => {
            if (saved) {
              trackFeaturedHeroClick({
                list_slug: list.slug,
                category_slug: categorySlug,
                action: 'save',
                slot_id: slotId ?? undefined,
              });
            }
            if (saved && slotId && list.id) {
              trackFeaturedClick(slotId, list.id, 'quick_save');
            }
          }}
        />
      </div>
    </div>
  );
}
