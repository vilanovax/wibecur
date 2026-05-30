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
    <section id="rising" className="border-t border-wibe/60 px-2.5 py-4" aria-labelledby="rising-title">
      <ExploreSectionTitle
        id="rising-title"
        title="در حال اوج گرفتن"
        subtitle="لیست‌های با مومنتوم بالا"
        icon="🚀"
      />
      <div className="grid grid-cols-2 gap-2">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="block overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm transition-transform active:scale-[0.99]"
          >
            <div className="relative aspect-[4/3] bg-gray-200">
              <ImageWithFallback
                src={list.coverUrl ?? ''}
                alt={list.title}
                className="h-full w-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-2xl"
              />
              <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 wibe-caption font-semibold text-white">
                در حال رشد
              </span>
              <div className="absolute inset-x-0 bottom-0 p-2">
                <ListCardStats
                  saves={list.savesCount}
                  itemCount={list.itemsCount}
                  variant="overlay"
                />
              </div>
            </div>
            <div className="p-2">
              <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
