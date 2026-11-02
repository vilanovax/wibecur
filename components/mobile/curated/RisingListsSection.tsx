'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCoverTitleOverlay from '@/components/shared/ListCoverTitleOverlay';
import ListCardStats from '@/components/shared/ListCardStats';
import ExploreSectionTitle from './ExploreSectionTitle';
import { getCoverDisplayFlags } from '@/lib/admin/category-form-constants';
import type { CuratedList } from '@/types/curated';
import { Card } from '@/components/ui/card';

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
        {lists.map((list) => {
          const coverMode = list.category?.coverDisplayMode;
          const { showTitleOnCover, showTitleBelow } = getCoverDisplayFlags(coverMode);
          return (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="group block"
          >
            <Card className="overflow-hidden bg-popover p-0 shadow-sm transition-[colors,transform] active:scale-[0.99] lg:hover:border-primary/20 lg:hover:shadow-md">
            <div className="relative aspect-4/3 bg-wibe-surface lg:aspect-16/10 lg:max-h-47.5">
              <ImageWithFallback
                src={list.coverUrl ?? ''}
                alt={list.title}
                className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
                fallbackIcon="📋"
                fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-2xl"
              />
              <span className="absolute inset-e-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-sm font-semibold text-primary-foreground">
                در حال رشد
              </span>
              <ListCoverTitleOverlay
                coverDisplayMode={coverMode}
                title={list.title}
                titleClassName="mb-1 line-clamp-2 wibe-small font-semibold text-white lg:text-base lg:font-bold"
                onCoverExtra={
                  <ListCardStats
                    saves={list.savesCount}
                    itemCount={list.itemsCount}
                    variant="overlay"
                    className="lg:text-sm"
                  />
                }
              />
              {!showTitleOnCover ? <span className="sr-only">{list.title}</span> : null}
            </div>
            {showTitleBelow ? (
              <div className="space-y-1 px-2.5 py-2 text-start">
                <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
                <ListCardStats saves={list.savesCount} itemCount={list.itemsCount} variant="compact" />
              </div>
            ) : null}
            </Card>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
