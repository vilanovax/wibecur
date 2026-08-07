'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { HomeListCreator } from '@/types/home-data';
import { trackHomeSectionClick, type HomeSectionId } from '@/lib/analytics';

/** نشانگر ذخیره — به‌جای متن «ذخیره‌شده» آیکون بوکمارک */
export const SAVED_LIST_BADGE = '__saved_list_bookmark__';

export interface HomeGridListCardList {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  saveCount: number;
  weeklySaves?: number;
  categories?: { slug?: string; icon?: string | null } | null;
  creator?: HomeListCreator | null;
}

interface HomeGridListCardProps {
  list: HomeGridListCardList;
  badge?: string | null;
  badgeClassName?: string;
  homeSection?: HomeSectionId;
}

/** کارت گرید Home — موبایل اسکرول افقی، دسکتاپ landscape فشرده */
export default function HomeGridListCard({
  list,
  badge,
  badgeClassName = 'bg-primary/90 text-white',
  homeSection,
}: HomeGridListCardProps) {
  const saveCount = list.saveCount ?? 0;

  return (
    <Link
      href={`/lists/${list.slug}`}
      onClick={() => {
        if (homeSection) {
          trackHomeSectionClick(homeSection, {
            list_slug: list.slug,
            category_slug: list.categories?.slug,
            target: 'card',
          });
        }
      }}
      className="group block w-[10.75rem] shrink-0 snap-start lg:w-full lg:shrink"
    >
      <div className="overflow-hidden rounded-2xl bg-wibe-card shadow-sm ring-1 ring-wibe/90 transition-[transform,box-shadow] active:scale-[0.99] lg:hover:shadow-md lg:hover:ring-primary/25">
        <div className="relative aspect-[5/4] w-full bg-wibe-surface sm:aspect-[4/3] lg:aspect-[16/10] lg:max-h-[11.5rem]">
          {badge === SAVED_LIST_BADGE ? (
            <span
              className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm"
              aria-label="ذخیره‌شده"
            >
              <Bookmark className="h-3.5 w-3.5 fill-current" strokeWidth={1.75} aria-hidden />
            </span>
          ) : badge ? (
            <span
              className={`absolute end-2 top-2 z-10 rounded-full px-2 py-0.5 wibe-caption font-semibold shadow-sm ${badgeClassName}`}
            >
              {badge}
            </span>
          ) : null}
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-3xl"
            categorySlug={list.categories?.slug}
            listSlug={list.slug}
            listTitle={list.title}
            sizes="(min-width: 1024px) 240px, 172px"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-right lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-bold leading-snug text-white drop-shadow-sm lg:text-sm lg:leading-snug">
              {list.title}
            </h3>
            {saveCount > 0 ? (
              <p className="mt-0.5 wibe-caption font-medium text-white/75 tabular-nums">
                {saveCount.toLocaleString('fa-IR')} ذخیره
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
