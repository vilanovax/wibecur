'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { HomeListCreator } from '@/types/home-data';
import { trackHomeSectionClick, type HomeSectionId } from '@/lib/analytics';
import { Card } from '@/components/ui/card';
import { normalizeCoverDisplayMode } from '@/lib/admin/category-form-constants';

/** نشانگر ذخیره‌شده برای سکشن‌های پروفایل/خانه — دیگر روی کارت نمایش داده نمی‌شود */
export const SAVED_LIST_BADGE = '__saved_list_bookmark__';

export interface HomeGridListCardList {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  saveCount: number;
  weeklySaves?: number;
  categories?: {
    slug?: string;
    icon?: string | null;
    coverDisplayMode?: string | null;
  } | null;
  creator?: HomeListCreator | null;
}

interface HomeGridListCardProps {
  list: HomeGridListCardList;
  badge?: string | null;
  badgeClassName?: string;
  homeSection?: HomeSectionId;
  /** فقط اولین کارت نزدیک LCP */
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}

/** کارت گرید Home — موبایل اسکرول افقی، دسکتاپ landscape فشرده */
export default function HomeGridListCard({
  list,
  badge,
  badgeClassName = 'bg-brand text-brand-foreground',
  homeSection,
  priority = false,
  fetchPriority,
}: HomeGridListCardProps) {
  const router = useRouter();
  const href = `/lists/${list.slug}`;
  const textBadge = badge && badge !== SAVED_LIST_BADGE ? badge : null;
  const resolvedFetchPriority = priority ? 'high' : (fetchPriority ?? 'low');
  const coverMode = normalizeCoverDisplayMode(list.categories?.coverDisplayMode);
  const showCoverScrim = coverMode === 'ui';
  const showCoverTitle = coverMode === 'ui';
  const showTitleBelow = coverMode === 'photo';

  return (
    <div className="group relative w-40 shrink-0 snap-start lg:w-full lg:shrink">
      <Link
        href={href}
        prefetch={false}
        onPointerDown={() => router.prefetch(href)}
        onClick={() => {
          if (homeSection) {
            trackHomeSectionClick(homeSection, {
              list_slug: list.slug,
              category_slug: list.categories?.slug,
              target: 'card',
            });
          }
        }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        aria-label={list.title}
      >
        <Card className="overflow-hidden bg-popover p-0 shadow-sm transition-[colors,transform] active:scale-95 lg:group-hover:border-brand/30 lg:group-hover:shadow-md">
          <div
            className={`relative w-full bg-muted ${
              showTitleBelow
                ? 'aspect-4/3 sm:aspect-16/10 lg:aspect-16/10 lg:max-h-40'
                : 'aspect-5/4 sm:aspect-4/3 lg:aspect-16/10 lg:max-h-44'
            }`}
          >
            {textBadge ? (
              <span
                className={`absolute inset-e-2 top-2 z-10 rounded-pill px-2 py-0.5 wibe-caption font-semibold shadow-sm ${badgeClassName}`}
              >
                {textBadge}
              </span>
            ) : null}
            <ImageWithFallback
              src={list.coverImage}
              alt={list.title}
              className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
              fallbackIcon={list.categories?.icon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-3xl"
              categorySlug={list.categories?.slug}
              listSlug={list.slug}
              listTitle={list.title}
              sizes="(min-width: 1024px) 240px, 176px"
              priority={priority}
              fetchPriority={resolvedFetchPriority}
            />
            {showCoverScrim ? (
              <div
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/90 via-foreground/35 to-foreground/5 lg:via-foreground/25"
                aria-hidden
              />
            ) : null}
            {showCoverTitle ? (
              <div className="absolute inset-x-0 bottom-0 p-2.5 text-start lg:p-3">
                <h3 className="line-clamp-2 wibe-small font-semibold text-background drop-shadow-sm lg:leading-snug">
                  {list.title}
                </h3>
              </div>
            ) : null}
          </div>
          {showTitleBelow ? (
            <div className="px-2.5 py-2 text-start">
              <h3 className="line-clamp-2 wibe-small font-semibold text-foreground lg:leading-snug">
                {list.title}
              </h3>
            </div>
          ) : null}
        </Card>
      </Link>
    </div>
  );
}
