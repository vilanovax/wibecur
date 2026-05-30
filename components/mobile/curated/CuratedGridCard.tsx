'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import { CURATED_CATEGORY_SLUGS } from '@/lib/category-cover-images';
import type { CuratedList } from '@/types/curated';

const BADGE_STYLES: Record<string, string> = {
  trending: 'bg-warning text-white',
  rising: 'bg-primary text-white',
  featured: 'bg-success text-white',
  ai: 'bg-info text-white',
};

const BADGE_LABELS: Record<string, string> = {
  trending: 'ترند',
  rising: 'در حال رشد',
  featured: 'ویژه',
  ai: 'AI',
};

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
      className="block overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-200">
        <ListCoverImage
          coverImage={list.coverUrl}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          className="h-full w-full object-cover"
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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2">
          <ListCardStats saves={list.savesCount} itemCount={list.itemsCount} variant="overlay" />
        </div>
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
        {subtitle && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}
