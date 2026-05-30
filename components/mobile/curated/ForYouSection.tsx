'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import ExploreSectionTitle from './ExploreSectionTitle';
import { formatNumber } from '@/lib/curated/utils';
import type { CuratedList } from '@/types/curated';

interface ForYouSectionProps {
  lists: CuratedList[];
}

export default function ForYouSection({ lists }: ForYouSectionProps) {
  const forYou = lists
    .filter((l) => l.badges.includes('featured') || l.creator.badges.includes('top'))
    .slice(0, 6);

  if (forYou.length === 0) return null;

  return (
    <section id="foryou" className="px-4 py-6" aria-labelledby="foryou-title">
      <ExploreSectionTitle
        id="foryou-title"
        title="برای تو"
        subtitle="بر اساس ذخیره‌ها و سلیقه"
        icon="✨"
      />
      <div className="space-y-3">
        {forYou.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-3 p-3 rounded-lg bg-wibe-card border border-primary/20 shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
              <ImageWithFallback
                src={list.coverUrl ?? ''}
                alt={list.title}
                className="w-full h-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="w-full h-full flex items-center justify-center text-xl bg-gray-200"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
              <p className="wibe-caption text-wibe-secondary mt-1">{list.creator.name}</p>
              <ListCardStats saves={list.savesCount} itemCount={list.itemsCount} variant="compact" className="mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
