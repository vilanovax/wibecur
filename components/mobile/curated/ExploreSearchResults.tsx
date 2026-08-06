'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import ExploreSectionTitle from './ExploreSectionTitle';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import SearchHighlight from '@/components/mobile/search/SearchHighlight';
import type { CuratedList } from '@/types/curated';

interface ExploreSearchResultsProps {
  lists: CuratedList[];
  query: string;
}

export default function ExploreSearchResults({ lists, query }: ExploreSearchResultsProps) {
  if (lists.length === 0) {
    return (
      <section className="px-2.5 py-10 text-center lg:px-0" aria-label="نتایج جستجو">
        <p className="wibe-body text-wibe-secondary">لیستی برای «{query}» پیدا نشد</p>
        <p className="mt-1 wibe-small text-wibe-secondary">عبارت دیگری امتحان کن یا دسته‌ها را ببین</p>
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
              className="group flex flex-row-reverse gap-3 rounded-xl border border-wibe bg-wibe-card p-2.5 shadow-sm transition-[colors,transform] active:scale-[0.99] lg:p-3 lg:hover:shadow-md"
            >
              <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-gray-200 lg:h-20 lg:w-20">
                <ImageWithFallback
                  src={list.coverUrl ?? ''}
                  alt={list.title}
                  className="h-full w-full object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-105"
                  fallbackIcon="📋"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-xl"
                />
              </div>
              <div className="min-w-0 flex-1 text-right">
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
            </Link>
          );
        })}
      </div>
    </section>
  );
}
