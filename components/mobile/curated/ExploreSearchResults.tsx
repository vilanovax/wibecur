'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import ExploreSectionTitle from './ExploreSectionTitle';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import SearchHighlight from '@/components/mobile/search/SearchHighlight';
import type { CuratedList } from '@/types/curated';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

interface ExploreSearchResultsProps {
  lists: CuratedList[];
  query: string;
}

export default function ExploreSearchResults({ lists, query }: ExploreSearchResultsProps) {
  if (lists.length === 0) {
    return (
      <section className="px-2.5 py-10 lg:px-0" aria-label="نتایج جستجو">
        <EmptyState
          title={`لیستی برای «${query}» پیدا نشد`}
          description="عبارت دیگری امتحان کن یا دسته‌ها را ببین."
        />
      </section>
    );
  }

  return (
    <section className="px-2.5 py-4 lg:px-0 lg:py-5" aria-label="نتایج جستجو">
      <ExploreSectionTitle
        title="نتایج جستجو"
        subtitle={`${lists.length.toLocaleString('fa-IR')} لیست برای «${query}»`}
        icon="🔍"
      />
      <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-3">
        {lists.map((list) => {
          const subtitle = getListCardSubtitle(list);
          return (
            <Link
              key={list.id}
              href={`/lists/${list.slug}`}
              className="group block"
            >
              <Card className="flex gap-3 bg-popover p-2.5 transition-transform active:scale-[0.99] lg:p-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted lg:size-20">
                <ImageWithFallback
                  src={list.coverUrl ?? ''}
                  alt={list.title}
                  className="h-full w-full object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-105"
                  fallbackIcon="📋"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl"
                />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <h3 className="line-clamp-2 wibe-small font-semibold text-foreground lg:text-base">
                  <SearchHighlight text={list.title} query={query} />
                </h3>
                {subtitle && (
                  <p className="mt-0.5 line-clamp-2 wibe-caption text-wibe-secondary lg:line-clamp-1 lg:text-sm">
                    <SearchHighlight text={subtitle} query={query} />
                  </p>
                )}
                <ListCardStats
                  saves={list.savesCount}
                  itemCount={list.itemsCount}
                  variant="minimal"
                  className="mt-1 lg:text-sm"
                />
              </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
