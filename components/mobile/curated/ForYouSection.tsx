'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import ExploreSectionTitle from './ExploreSectionTitle';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import type { CuratedList } from '@/types/curated';

interface ForYouSectionProps {
  lists: CuratedList[];
  personalized?: boolean;
}

export default function ForYouSection({ lists, personalized = false }: ForYouSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section id="foryou" className="border-t border-wibe/60 px-2.5 py-4" aria-labelledby="foryou-title">
      <ExploreSectionTitle
        id="foryou-title"
        title="پیشنهاد وایب"
        subtitle={personalized ? 'بر اساس علایق تو' : 'برترین لیست‌های منتخب'}
        icon="✨"
      />
      <div className="space-y-2">
        {lists.map((list, index) => {
          const subtitle = getListCardSubtitle(list);
          return (
            <Link
              key={list.id}
              href={`/lists/${list.slug}`}
              className={`flex flex-row-reverse gap-2.5 rounded-xl border p-2.5 shadow-sm transition-transform active:scale-[0.99] ${
                index === 0
                  ? 'border-primary/25 bg-primary/[0.04]'
                  : 'border-wibe bg-wibe-card'
              }`}
            >
              <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-gray-200">
                <ImageWithFallback
                  src={list.coverUrl ?? ''}
                  alt={list.title}
                  className="h-full w-full object-cover"
                  fallbackIcon="📋"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-xl"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
                {subtitle && (
                  <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">{subtitle}</p>
                )}
                <ListCardStats
                  saves={list.savesCount}
                  itemCount={list.itemsCount}
                  variant="minimal"
                  className="mt-1"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
