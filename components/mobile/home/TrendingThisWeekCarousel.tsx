'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import HomeSectionTitle from './HomeSectionTitle';

const CARD_WIDTH = 160;
const CARD_HEIGHT = Math.round(CARD_WIDTH * (183 / 136));

interface TrendingThisWeekCarouselProps {
  /** داخل HomeFeedTabs — بدون عنوان بخش */
  embedded?: boolean;
}

export default function TrendingThisWeekCarousel({ embedded = false }: TrendingThisWeekCarouselProps) {
  const { data, isLoading } = useHomeData();
  const lists = (data?.trending ?? []).slice(0, 6);

  if (isLoading && lists.length === 0) {
    return (
      <section className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          </div>
        )}
        <div className="flex gap-2.5 overflow-hidden px-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 animate-pulse rounded-lg bg-gray-100"
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) {
    return embedded ? (
      <p className="px-4 py-6 text-center wibe-small text-wibe-secondary">فعلاً لیست ترندی نیست</p>
    ) : null;
  }

  return (
    <section className={embedded ? 'overflow-x-hidden' : 'mb-6 overflow-x-hidden'}>
      {!embedded && (
        <HomeSectionTitle
          icon="🔥"
          title="ترند این هفته"
          subtitle="بر اساس ذخیره و تعامل"
          actionHref="/lists?mode=trending"
          actionLabel="همه"
        />
      )}
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-0.5 scrollbar-hide lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:snap-none xl:grid-cols-4">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="shrink-0 snap-start lg:w-full lg:shrink"
            style={{ width: CARD_WIDTH }}
          >
            <div
              className="box-border overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-card lg:!w-full lg:!h-auto lg:aspect-[136/183]"
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            >
              <div className="relative h-full w-full bg-gray-100">
                <span className="absolute right-2 top-2 z-10 rounded-pill bg-warning px-2 py-0.5 wibe-caption font-semibold text-white shadow-sm">
                  ترند
                </span>
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="h-full w-full object-cover"
                  fallbackIcon={list.categories?.icon ?? '📋'}
                  fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200"
                  categorySlug={list.categories?.slug}
                  listSlug={list.slug}
                  listTitle={list.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/35 p-3 backdrop-blur-[1px]">
                  <h3 className="line-clamp-2 wibe-small font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    {list.title}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1 wibe-caption text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    <Bookmark className="h-3.5 w-3.5 shrink-0" />
                    {list.saveCount.toLocaleString('fa-IR')} ذخیره
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
