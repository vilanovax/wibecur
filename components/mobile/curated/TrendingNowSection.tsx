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
  const trending = lists
    .filter((l) => l.badges.includes('trending') || (l.savesCount ?? 0) >= 20)
    .sort((a, b) => (b.savesCount ?? 0) - (a.savesCount ?? 0))
    .slice(0, 10);

  if (trending.length === 0) return null;

  return (
    <section id="trending" className="px-4 py-6" aria-labelledby="trending-title">
      <ExploreSectionTitle
        id="trending-title"
        title="داغ‌ترین لیست‌های امروز"
        subtitle="بر اساس ذخیره"
        icon="🔥"
      />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {trending.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[200px] snap-start active:scale-[0.99] transition-transform"
          >
            <div className="rounded-lg overflow-hidden bg-wibe-card border border-wibe shadow-card">
              <div className="relative aspect-[4/3] bg-gray-200">
                <ImageWithFallback
                  src={list.coverUrl ?? ''}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  fallbackIcon="📋"
                  fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-gray-200"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-pill wibe-caption font-semibold bg-warning text-white">
                  ترند
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <ListCardStats saves={list.savesCount} itemCount={list.itemsCount} variant="overlay" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
