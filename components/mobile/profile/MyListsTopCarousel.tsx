'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import type { MyListCardData } from './MyListCardCompact';

interface MyListsTopCarouselProps {
  lists: MyListCardData[];
}

/** هایلایت فشرده — فقط ۲–۳ کارت کوچک، بدون بج تکراری */
export default function MyListsTopCarousel({ lists }: MyListsTopCarouselProps) {
  if (lists.length === 0) return null;

  return (
    <section aria-labelledby="top-public-lists-title">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="top-public-lists-title" className="wibe-small font-bold text-foreground">
          برترین عمومی
        </h2>
        <span className="shrink-0 wibe-caption text-wibe-secondary">بر اساس ذخیره</span>
      </div>
      <div className="overflow-hidden lg:overflow-visible">
        <div
          className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible"
          dir="rtl"
        >
        {lists.map((list) => {
          const saveCount = list.saveCount ?? list._count?.bookmarks ?? 0;
          const itemCount = list.itemCount ?? list._count?.items ?? 0;
          return (
            <Link
              key={list.id}
              href={`/user-lists/${list.id}`}
              className="block w-[calc((100%-0.625rem)/2)] shrink-0 snap-start overflow-hidden rounded-xl border border-wibe bg-wibe-card transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:w-auto"
            >
              <div className="relative h-[5.75rem] overflow-hidden bg-wibe-surface">
                <ListCoverImage
                  coverImage={list.coverImage}
                  title={list.title}
                  slug={list.slug}
                  categorySlug={list.categories?.slug}
                  className="h-full w-full object-cover"
                  fallbackIcon={list.categories?.icon ?? '📋'}
                  fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-2 pt-6">
                  <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-white">
                    {list.title}
                  </h3>
                  <ListCardStats
                    saves={saveCount}
                    itemCount={itemCount}
                    variant="overlay"
                    className="mt-0.5"
                  />
                </div>
              </div>
            </Link>
          );
        })}
        </div>
      </div>
    </section>
  );
}
