'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import ExploreSectionTitle from './ExploreSectionTitle';
import type { CuratedList } from '@/types/curated';

interface RisingListsSectionProps {
  lists: CuratedList[];
}

export default function RisingListsSection({ lists }: RisingListsSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section
      id="rising"
      className="border-t border-wibe/60 px-2.5 py-4 lg:px-0 lg:py-5"
      aria-labelledby="rising-title"
    >
      <ExploreSectionTitle
        id="rising-title"
        title="در حال اوج گرفتن"
        subtitle="لیست‌های با مومنتوم بالا"
        icon="🚀"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="group block overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm transition-[colors,transform] active:scale-[0.99] lg:hover:border-primary/20 lg:hover:shadow-md"
          >
            <div className="relative aspect-[4/3] bg-wibe-surface lg:aspect-[16/10] lg:max-h-[190px]">
              <ImageWithFallback
                src={list.coverUrl ?? ''}
                alt={list.title}
                className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
                fallbackIcon="📋"
                fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-2xl"
              />
              <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 wibe-caption font-semibold text-white">
                در حال رشد
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5 text-right lg:p-3">
                <h3 className="mb-1 line-clamp-2 wibe-small font-semibold text-white lg:text-base lg:font-bold">
                  {list.title}
                </h3>
                <ListCardStats
                  saves={list.savesCount}
                  itemCount={list.itemsCount}
                  variant="overlay"
                  className="lg:text-sm"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
