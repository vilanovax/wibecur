'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import HomeListSaveControl from '@/components/mobile/home/HomeListSaveControl';
import type { HomeListCreator } from '@/types/home-data';
import { trackHomeSectionClick, type HomeSectionId } from '@/lib/analytics';

/** نشانگر ذخیره‌شده — وضعیت اولیهٔ کنترل ذخیره */
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
  /** ذخیرهٔ سریع روی کارت — پیش‌فرض روشن */
  showSave?: boolean;
}

/** کارت گرید Home — موبایل اسکرول افقی، دسکتاپ landscape فشرده */
export default function HomeGridListCard({
  list,
  badge,
  badgeClassName = 'bg-primary/90 text-white',
  homeSection,
  showSave = true,
}: HomeGridListCardProps) {
  const isSavedBadge = badge === SAVED_LIST_BADGE;
  const textBadge = badge && !isSavedBadge ? badge : null;

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
      className="group block w-[10rem] shrink-0 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 lg:w-full lg:shrink"
    >
      <div className="overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-card transition-[colors,transform] active:scale-[0.99] lg:rounded-xl lg:hover:border-primary/20 lg:hover:shadow-md">
        <div className="relative aspect-[5/4] w-full bg-wibe-surface sm:aspect-[4/3] lg:aspect-[16/10] lg:max-h-[11.5rem]">
          {showSave ? (
            <div className="absolute right-2 top-2 z-10">
              <HomeListSaveControl
                listId={list.id}
                listSlug={list.slug}
                categorySlug={list.categories?.slug}
                saveCount={list.saveCount}
                initialIsBookmarked={isSavedBadge}
                analyticsSource={homeSection ? `home_${homeSection}` : 'home_card'}
              />
            </div>
          ) : isSavedBadge ? (
            <span
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary/90 text-white shadow-sm"
              aria-label="ذخیره‌شده"
            >
              <Bookmark className="h-3.5 w-3.5 fill-current" strokeWidth={1.75} aria-hidden />
            </span>
          ) : null}
          {textBadge ? (
            <span
              className={`absolute left-2 top-2 z-10 rounded-pill px-2 py-0.5 wibe-caption font-semibold shadow-sm ${badgeClassName}`}
            >
              {textBadge}
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
            sizes="(min-width: 1024px) 240px, 160px"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5 lg:via-black/25"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-right lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-white drop-shadow-sm lg:leading-snug">
              {list.title}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}
