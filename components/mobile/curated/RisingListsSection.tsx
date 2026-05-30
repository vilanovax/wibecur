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
  const rising = lists
    .filter((l) => l.badges.includes('rising') || (l.weeklyVelocity ?? 0) > 100)
    .sort((a, b) => (b.weeklyVelocity ?? 0) - (a.weeklyVelocity ?? 0))
    .slice(0, 6);

  if (rising.length === 0) return null;

  return (
    <section id="rising" className="px-4 py-6" aria-labelledby="rising-title">
      <ExploreSectionTitle
        id="rising-title"
        title="در حال اوج گرفتن"
        subtitle="لیست‌های با مومنتوم بالا"
        icon="🚀"
      />
      <div className="grid grid-cols-2 gap-3">
        {rising.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="block rounded-lg overflow-hidden bg-wibe-card border border-wibe shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="relative aspect-[4/3] bg-gray-200">
              <ImageWithFallback
                src={list.coverUrl ?? ''}
                alt={list.title}
                className="w-full h-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-gray-200"
              />
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-pill wibe-caption font-semibold bg-primary text-white">
                در حال رشد
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <ListCardStats saves={list.savesCount} itemCount={list.itemsCount} variant="overlay" />
              </div>
            </div>
            <div className="p-2.5">
              <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
