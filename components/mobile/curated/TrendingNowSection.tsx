'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import ExploreSectionTitle from './ExploreSectionTitle';
import type { CuratedList } from '@/types/curated';

interface TrendingNowSectionProps {
  lists: CuratedList[];
  subtitle?: string;
}

export default function TrendingNowSection({
  lists,
  subtitle = 'بر اساس ذخیره',
}: TrendingNowSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section id="trending" className="px-2.5 py-4 lg:px-0 lg:py-5" aria-labelledby="trending-title">
      <ExploreSectionTitle
        id="trending-title"
        title="داغ‌ترین لیست‌های امروز"
        subtitle={subtitle}
        icon="🔥"
      />

      <div
        className={
          lists.length === 1
            ? 'max-w-md'
            : 'scrollbar-hide flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:snap-none xl:grid-cols-4'
        }
      >
        {lists.map((list) => (
          <div
            key={list.id}
            className={
              lists.length === 1
                ? 'w-full'
                : 'w-[88%] max-w-[280px] shrink-0 snap-start lg:w-full lg:max-w-none'
            }
          >
            <TrendingCard list={list} />
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendingCard({ list }: { list: CuratedList }) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block transition-transform active:scale-[0.99] lg:hover:scale-[1.01]"
    >
      <div className="overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm lg:rounded-xl lg:group-hover:shadow-md">
        <div className="relative aspect-[4/3] bg-gray-200 lg:aspect-[16/10] lg:max-h-[200px]">
          <ImageWithFallback
            src={list.coverUrl ?? ''}
            alt={list.title}
            className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
            fallbackIcon="📋"
            fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-2xl"
          />
          <span className="absolute right-2 top-2 rounded-full bg-warning px-2 py-0.5 wibe-caption font-semibold text-white lg:text-xs">
            ترند
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent lg:from-black/85" />
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-right lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-white lg:hidden">{list.title}</h3>
            <h3 className="mb-1 hidden line-clamp-2 text-base font-bold leading-snug text-white lg:block">
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
        <div className="p-2.5 lg:hidden">
          <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
        </div>
      </div>
    </Link>
  );
}
