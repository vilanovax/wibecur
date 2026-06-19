'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import ListVisibilityBadge, { getListVisibilityVariant } from './ListVisibilityBadge';
import type { MyListCardData } from './MyListCardCompact';

interface MyListsTopCarouselProps {
  lists: MyListCardData[];
}

export default function MyListsTopCarousel({ lists }: MyListsTopCarouselProps) {
  if (lists.length === 0) return null;

  return (
    <section className="mb-4 -mx-4">
      <div className="mb-2.5 flex items-baseline justify-between gap-2 px-4">
        <h2 className="wibe-h3">⭐ برترین لیست‌های عمومی</h2>
        <span className="shrink-0 wibe-caption text-wibe-secondary">بر اساس ذخیره</span>
      </div>
      <div className="relative">
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-ps-4 scroll-pe-6 px-4 pb-2 scrollbar-hide"
          dir="rtl"
        >
          {lists.map((list) => {
            const saveCount = list.saveCount ?? list._count?.bookmarks ?? 0;
            const itemCount = list.itemCount ?? list._count?.items ?? 0;
            const visibility = getListVisibilityVariant(list);
            return (
              <Link
                key={list.id}
                href={`/user-lists/${list.id}`}
                className="block w-[168px] shrink-0 snap-start overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-transform active:scale-[0.99]"
              >
                <div className="relative h-[7.75rem] overflow-hidden bg-gray-200">
                  <ListCoverImage
                    coverImage={list.coverImage}
                    title={list.title}
                    slug={list.slug}
                    categorySlug={list.categories?.slug}
                    className="h-full w-full object-cover"
                    fallbackIcon={list.categories?.icon ?? '📋'}
                    fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-2xl"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 via-45% to-black/5"
                    aria-hidden
                  />
                  <div className="absolute start-2 top-2">
                    <ListVisibilityBadge variant={visibility} size="sm" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8">
                    <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-white drop-shadow-sm">
                      {list.title}
                    </h3>
                    <ListCardStats
                      saves={saveCount}
                      itemCount={itemCount}
                      variant="overlay"
                      className="mt-1"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 start-0 w-3 bg-gradient-to-r from-wibe-card/80 to-transparent"
          aria-hidden
        />
      </div>
    </section>
  );
}
