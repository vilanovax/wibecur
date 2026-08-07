'use client';

import { memo } from 'react';
import LazyItemCoverImage from '@/components/shared/LazyItemCoverImage';
import ListItemQuickActions from '@/components/mobile/lists/ListItemQuickActions';
import { buildListItemQuickActions } from '@/lib/list-item-quick-actions';
import { isMovieLikeCategory, isPortraitCoverCategory } from '@/lib/resolve-item-image';

/** srcset next/image برای گرید ۲–۴ ستونه */
export const LIST_GRID_IMAGE_SIZES =
  '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw';

type ListGridItemCardProps = {
  item: {
    id: string;
    title: string;
    imageUrl: string | null;
    displayImageUrl?: string | null;
    metadata?: Record<string, unknown> | null;
  };
  index: number;
  categorySlug?: string | null;
  categoryIcon?: string | null;
  onOpenAt: (index: number) => void;
};

function ListGridItemCard({
  item,
  index,
  categorySlug,
  categoryIcon,
  onOpenAt,
}: ListGridItemCardProps) {
  const isMovieGrid = isMovieLikeCategory(categorySlug);
  const isPortraitCover = isPortraitCoverCategory(categorySlug);
  const quickActions = buildListItemQuickActions(item.metadata, categorySlug);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-wibe-card text-right shadow-sm ring-1 ring-wibe/90 transition-[transform,box-shadow] lg:hover:shadow-md lg:hover:ring-primary/25">
      <button
        type="button"
        onClick={() => onOpenAt(index)}
        aria-label={`رفتن به آیتم ${(index + 1).toLocaleString('fa-IR')}${item.title ? ` — ${item.title}` : ''}`}
        className="block w-full text-right transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35 active:scale-[0.99]"
      >
        <div
          className={`relative overflow-hidden bg-wibe-surface ${
            isPortraitCover
              ? 'aspect-[2/3] lg:mx-auto lg:max-h-[13.5rem] lg:w-full lg:max-w-[10.5rem]'
              : 'aspect-[4/3] lg:max-h-[11rem]'
          }`}
        >
          <LazyItemCoverImage
            itemId={item.id}
            imageUrl={item.displayImageUrl ?? item.imageUrl}
            title={item.title}
            metadata={item.metadata}
            categorySlug={categorySlug}
            className="h-full w-full object-cover"
            fallbackIcon={categoryIcon ?? '🎬'}
            fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-2xl"
            enrichWhenVisible={false}
            coverLayout="grid"
            sizes={LIST_GRID_IMAGE_SIZES}
          />
          <span
            className="absolute end-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/70 px-1.5 ring-1 ring-white/20 wibe-caption font-bold text-white tabular-nums backdrop-blur-sm"
            aria-hidden
          >
            {(index + 1).toLocaleString('fa-IR')}
          </span>
          {!isMovieGrid && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2.5 pb-2.5 pt-12">
              <p className="line-clamp-2 text-start text-caption font-bold leading-snug text-white drop-shadow-sm">
                {item.title}
              </p>
            </div>
          )}
        </div>
        {isMovieGrid && item.title ? (
          <div className="border-t border-wibe/50 px-2.5 py-2">
            <p className="line-clamp-2 wibe-caption font-semibold leading-snug text-foreground">
              {item.title}
            </p>
          </div>
        ) : null}
      </button>
      {quickActions.length > 0 && (
        <div className="border-t border-wibe/60 bg-wibe-surface/40 px-2.5 py-2 lg:px-3">
          <ListItemQuickActions actions={quickActions} size="sm" className="justify-start" />
        </div>
      )}
    </div>
  );
}

export default memo(ListGridItemCard);
