'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import { LIST_BADGE_LABELS, listBadgeSolidStyles } from '@/lib/list-badge-styles';
import { CURATED_CATEGORY_SLUGS } from '@/lib/category-cover-images';
import type { CuratedList } from '@/types/curated';

const BADGE_STYLES = listBadgeSolidStyles;
const BADGE_LABELS = LIST_BADGE_LABELS;

interface CuratedGridCardProps {
  list: CuratedList;
}

export default function CuratedGridCard({ list }: CuratedGridCardProps) {
  const topBadge = list.badges[0];
  const categorySlug = CURATED_CATEGORY_SLUGS[list.categoryId];
  const subtitle = getListCardSubtitle(list);

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-[colors,transform] active:scale-[0.99] lg:rounded-xl lg:hover:border-primary/20 lg:hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-200 lg:aspect-[16/10] lg:max-h-[200px]">
        <ListCoverImage
          coverImage={list.coverUrl}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
          fallbackIcon="📋"
          fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-3xl"
        />
        {topBadge && (
          <span
            className={`absolute right-2 top-2 rounded-pill px-2 py-0.5 wibe-caption font-semibold ${BADGE_STYLES[topBadge] ?? 'bg-gray-800 text-white'}`}
          >
            {BADGE_LABELS[topBadge] ?? topBadge}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 text-right lg:p-3">
          <h3 className="mb-1 line-clamp-2 wibe-small font-semibold text-white lg:text-base lg:font-bold">
            {list.title}
          </h3>
          <ListCardStats
            saves={list.savesCount}
            itemCount={list.itemsCount}
            variant="overlay"
            className="lg:text-sm"
          />
        </div>
      </div>
      {subtitle && (
        <p className="line-clamp-1 px-2.5 py-2 wibe-caption text-wibe-secondary lg:hidden">{subtitle}</p>
      )}
    </Link>
  );
}
