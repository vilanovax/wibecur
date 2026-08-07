'use client';

import { memo } from 'react';
import LazyItemCoverImage from '@/components/shared/LazyItemCoverImage';
import ListItemQuickActions from '@/components/mobile/lists/ListItemQuickActions';
import { buildListItemQuickActions } from '@/lib/list-item-quick-actions';
import { isMovieLikeCategory, isPortraitCoverCategory } from '@/lib/resolve-item-image';
import { IMAGE_SIZES } from '@/lib/image-sizes';

/** srcset next/image برای گرید ۲–۴ ستونه */
export const LIST_GRID_IMAGE_SIZES = IMAGE_SIZES.listGridCard;

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
    <div className="flex flex-col overflow-hidden rounded-lg border border-wibe bg-wibe-card text-right shadow-sm transition-colors lg:hover:border-primary/20 lg:hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpenAt(index)}
        aria-label={`رفتن به آیتم ${(index + 1).toLocaleString('fa-IR')}${item.title ? ` — ${item.title}` : ''}`}
        className="block w-full text-right transition-colors active:scale-[0.99]"
      >
        <div
          className={`relative overflow-hidden ${
            isPortraitCover
              ? 'aspect-[2/3] lg:mx-auto lg:max-h-[13.5rem] lg:w-full lg:max-w-[10.5rem]'
              : 'aspect-[4/3] lg:max-h-[10.5rem]'
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
            fallbackClassName="flex h-full w-full items-center justify-center text-2xl"
            enrichWhenVisible={false}
            coverLayout="grid"
            sizes={LIST_GRID_IMAGE_SIZES}
          />
          <span
            className="absolute right-1.5 top-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-black/70 px-1.5 ring-1 ring-white/25 wibe-caption font-bold text-white tabular-nums"
            aria-hidden
          >
            {(index + 1).toLocaleString('fa-IR')}
          </span>
          {!isMovieGrid && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-10">
              <p className="line-clamp-2 text-start text-[11px] font-semibold leading-snug text-white lg:text-xs">
                {item.title}
              </p>
            </div>
          )}
        </div>
      </button>
      {quickActions.length > 0 && (
        <div className="border-t border-wibe/60 px-2.5 py-2 lg:px-3">
          <ListItemQuickActions actions={quickActions} size="sm" />
        </div>
      )}
    </div>
  );
}

export default memo(ListGridItemCard);
