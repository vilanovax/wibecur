'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import type { CategoryListCard } from '@/types/category-page';

interface CategoryListCardImprovedProps {
  list: CategoryListCard;
  accentColor?: string;
  categorySlug?: string | null;
}

export default function CategoryListCardImproved({
  list,
  accentColor = '#6366F1',
  categorySlug,
}: CategoryListCardImprovedProps) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      className="flex gap-3 p-3 rounded-lg bg-wibe-card border border-wibe shadow-sm active:scale-[0.99] transition-transform"
    >
      <div className="relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-wibe-surface">
        <ListCoverImage
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          className="w-full h-full object-cover"
          fallbackIcon="📋"
          fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-wibe-surface"
        />
        {list.badge && (
          <span className="absolute top-1 right-1 wibe-caption font-semibold text-white px-1.5 py-0.5 rounded-pill bg-warning">
            {list.badge === 'viral' || list.badge === 'hot' ? 'ترند' : 'ویژه'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {list.creator?.image ? (
            <ImageWithFallback
              src={list.creator.image}
              alt={list.creator.name || ''}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-wibe-surface flex items-center justify-center wibe-caption flex-shrink-0">
              {(list.creator?.name || '?')[0]}
            </div>
          )}
          <span className="wibe-caption text-wibe-secondary truncate">
            {list.creator?.name || 'کاربر'}
          </span>
          {list.cityTag && (
            <span className="wibe-caption px-1.5 py-0.5 rounded-md bg-wibe-surface text-wibe-secondary">
              {list.cityTag}
            </span>
          )}
        </div>
        <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
        <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="compact" className="mt-1" />
      </div>
    </Link>
  );
}
