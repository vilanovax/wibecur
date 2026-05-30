'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import type { MyListCardData } from './MyListCardCompact';

interface MyListsTopCarouselProps {
  lists: MyListCardData[];
}

export default function MyListsTopCarousel({ lists }: MyListsTopCarouselProps) {
  if (lists.length === 0) return null;

  return (
    <section className="mb-4">
      <h2 className="wibe-h3 mb-2.5">⭐ برترین لیست‌ها</h2>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1" dir="ltr">
        <div className="flex gap-2.5" style={{ direction: 'rtl' }}>
          {lists.map((list) => {
            const saveCount = list.saveCount ?? list._count?.bookmarks ?? 0;
            const itemCount = list.itemCount ?? list._count?.items ?? 0;
            return (
              <Link
                key={list.id}
                href={`/user-lists/${list.id}`}
                className="block w-[140px] shrink-0 rounded-lg overflow-hidden border border-wibe bg-wibe-card shadow-sm active:scale-[0.99] transition-transform"
              >
                <div className="relative h-28 bg-gray-200 overflow-hidden">
                  <ListCoverImage
                    coverImage={list.coverImage}
                    title={list.title}
                    slug={list.slug}
                    categorySlug={list.categories?.slug}
                    className="w-full h-full object-cover"
                    fallbackIcon={list.categories?.icon ?? '📋'}
                    fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-gray-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2" dir="rtl">
                    <h3 className="wibe-caption font-semibold text-white line-clamp-2 leading-snug">
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
