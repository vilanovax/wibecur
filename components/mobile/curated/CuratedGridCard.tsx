'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCoverTitleOverlay from '@/components/shared/ListCoverTitleOverlay';
import ListCardStats from '@/components/shared/ListCardStats';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import { LIST_BADGE_LABELS, listBadgeSolidStyles } from '@/lib/list-badge-styles';
import { CURATED_CATEGORY_SLUGS } from '@/lib/category-cover-images';
import { getCoverDisplayFlags } from '@/lib/admin/category-form-constants';
import type { CuratedList } from '@/types/curated';

const BADGE_STYLES = listBadgeSolidStyles;
const BADGE_LABELS = LIST_BADGE_LABELS;

interface CuratedGridCardProps {
  list: CuratedList;
}

export default function CuratedGridCard({ list }: CuratedGridCardProps) {
  const topBadge = list.badges[0];
  const categorySlug = list.category?.slug ?? CURATED_CATEGORY_SLUGS[list.categoryId];
  const coverMode = list.category?.coverDisplayMode;
  const { showTitleOnCover, showTitleBelow } = getCoverDisplayFlags(coverMode);
  const subtitle = getListCardSubtitle(list);

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-[colors,transform] active:scale-[0.99] lg:rounded-xl lg:hover:border-primary/20 lg:hover:shadow-md"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-wibe-surface lg:aspect-16/10 lg:max-h-50">
        <ListCoverImage
          coverImage={list.coverUrl}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
          fallbackIcon="📋"
          fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-3xl"
        />
        {topBadge && (
          <span
            className={`absolute inset-e-2 top-2 z-10 rounded-pill px-2 py-0.5 wibe-caption font-semibold ${BADGE_STYLES[topBadge] ?? 'bg-black/75 text-white'}`}
          >
            {BADGE_LABELS[topBadge] ?? topBadge}
          </span>
        )}
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
      {!showTitleBelow && subtitle ? (
        <p className="line-clamp-1 px-2.5 py-2 wibe-caption text-wibe-secondary lg:hidden">{subtitle}</p>
      ) : null}
    </Link>
  );
}
