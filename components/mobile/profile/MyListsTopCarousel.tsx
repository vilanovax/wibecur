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
    <section className="mb-0 -mx-4 lg:mx-0" aria-labelledby="top-public-lists-title">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-4 lg:px-0">
        <h2 id="top-public-lists-title" className="wibe-small font-bold text-foreground">
          برترین عمومی
        </h2>
        <span className="shrink-0 wibe-caption text-wibe-secondary">بر اساس ذخیره</span>
      </div>
      <div
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-ps-4 scroll-pe-5 px-4 pb-0.5 scrollbar-hide lg:scroll-ps-0 lg:px-0"
        dir="rtl"
      >
        {lists.map((list) => {
          const saveCount = list.saveCount ?? list._count?.bookmarks ?? 0;
          const itemCount = list.itemCount ?? list._count?.items ?? 0;
          return (
            <Link
              key={list.id}
              href={`/user-lists/${list.id}`}
              className="block w-[132px] shrink-0 snap-start overflow-hidden rounded-xl border border-wibe bg-wibe-card transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99]"
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
    </section>
  );
}
