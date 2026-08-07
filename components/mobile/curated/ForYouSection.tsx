'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ExploreSectionTitle from './ExploreSectionTitle';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import type { CuratedList } from '@/types/curated';

interface ForYouSectionProps {
  lists: CuratedList[];
  personalized?: boolean;
  diverseCategories?: boolean;
}

function resolveForYouSubtitle(personalized: boolean, diverseCategories: boolean): string {
  if (personalized && diverseCategories) return 'علایق تو · از هر دسته';
  if (diverseCategories) return 'از هر دسته یک پیشنهاد';
  if (personalized) return 'بر اساس علایق تو';
  return 'برترین لیست‌های منتخب';
}

export default function ForYouSection({
  lists,
  personalized = false,
  diverseCategories = false,
}: ForYouSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section
      id="foryou"
      className="border-t border-wibe/50 px-3.5 py-5 lg:px-0 lg:py-6"
      aria-labelledby="foryou-title"
    >
      <ExploreSectionTitle
        id="foryou-title"
        title="پیشنهاد وایب"
        subtitle={resolveForYouSubtitle(personalized, diverseCategories)}
        icon="✨"
      />
      <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-3">
        {lists.map((list, index) => {
          const subtitle = getListCardSubtitle(list);
          const categoryIcon = list.category?.icon ?? null;
          return (
            <Link
              key={list.id}
              href={`/lists/${list.slug}`}
              className={`group flex flex-row-reverse gap-3 rounded-2xl border p-2.5 shadow-sm transition-[transform,box-shadow] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:gap-3 lg:p-3 lg:hover:shadow-md ${
                index === 0
                  ? 'border-primary/25 bg-primary/[0.04]'
                  : 'border-wibe bg-wibe-card hover:border-primary/20'
              }`}
            >
              <div className="h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-xl bg-wibe-surface lg:h-20 lg:w-20">
                <ImageWithFallback
                  src={list.coverUrl ?? ''}
                  alt={list.title}
                  className="h-full w-full object-cover transition-transform duration-300 lg:group-hover:scale-105"
                  fallbackIcon={categoryIcon ?? '📋'}
                  fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl"
                  width={80}
                  height={80}
                  priority={index === 0}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center text-right">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 line-clamp-2 wibe-small font-bold text-foreground lg:text-base">
                    {list.title}
                  </h3>
                  {categoryIcon ? (
                    <span className="shrink-0 text-base leading-none" aria-hidden>
                      {categoryIcon}
                    </span>
                  ) : null}
                </div>
                {subtitle ? (
                  <p className="mt-1 line-clamp-2 wibe-caption leading-relaxed text-wibe-secondary lg:line-clamp-2">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
