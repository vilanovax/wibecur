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
      <section className="px-2.5 py-10 text-center" aria-label="نتایج جستجو">
        <p className="wibe-body text-wibe-secondary">لیستی برای «{query}» پیدا نشد</p>
        <p className="mt-1 wibe-small text-wibe-secondary">عبارت دیگری امتحان کن یا دسته‌ها را ببین</p>
      </section>
    );
  }

  return (
    <section className="px-2.5 py-4" aria-label="نتایج جستجو">
      <ExploreSectionTitle
        title="نتایج جستجو"
        subtitle={`${lists.length.toLocaleString('fa-IR')} لیست برای «${query}»`}
        icon="🔍"
      />
      <div className="space-y-2.5">
        {lists.map((list) => {
          const subtitle = getListCardSubtitle(list);
          return (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex flex-row-reverse gap-3 rounded-xl border border-wibe bg-wibe-card p-2.5 shadow-sm transition-transform active:scale-[0.99]"
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
              <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">
                <SearchHighlight text={list.title} query={query} />
              </h3>
              {subtitle && (
                <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">
                  <SearchHighlight text={subtitle} query={query} />
                </p>
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
