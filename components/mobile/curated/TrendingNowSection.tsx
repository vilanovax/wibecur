'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import ExploreSectionTitle from './ExploreSectionTitle';
import type { CuratedList } from '@/types/curated';

interface TrendingNowSectionProps {
  lists: CuratedList[];
}

export default function TrendingNowSection({ lists }: TrendingNowSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section id="trending" className="px-2.5 py-4" aria-labelledby="trending-title">
      <ExploreSectionTitle
        id="trending-title"
        title="داغ‌ترین لیست‌های امروز"
        subtitle="بر اساس ذخیره"
        icon="🔥"
      />

      {lists.length === 1 ? (
        <TrendingCard list={lists[0]} />
      ) : (
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1">
          {lists.map((list) => (
            <div key={list.id} className="w-[88%] max-w-[280px] shrink-0 snap-start">
              <TrendingCard list={list} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TrendingCard({ list }: { list: CuratedList }) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      className="block transition-transform active:scale-[0.99]"
    >
      <div className="overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm">
        <div className="relative aspect-[4/3] bg-gray-200">
          <ImageWithFallback
            src={list.coverUrl ?? ''}
            alt={list.title}
            className="h-full w-full object-cover"
            fallbackIcon="📋"
            fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-2xl"
          />
          <span className="absolute right-2 top-2 rounded-full bg-warning px-2 py-0.5 wibe-caption font-semibold text-white">
            ترند
          </span>
          <div className="absolute inset-x-0 bottom-0 p-2">
            <ListCardStats
              saves={list.savesCount}
              itemCount={list.itemsCount}
              variant="overlay"
            />
          </div>
        </div>
        <div className="p-2.5">
          <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
        </div>
      </div>
    </Link>
  );
}
