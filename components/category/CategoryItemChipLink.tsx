'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryItemCard } from '@/types/category-page';

export type CategoryItemChipLayout = 'tile' | 'poster';

interface CategoryItemChipLinkProps {
  item: CategoryItemCard;
  accentColor?: string;
  /** tile: مربع (کافه و عمومی) | poster: کاور عمودی فیلم/کتاب */
  layout?: CategoryItemChipLayout;
}

export default function CategoryItemChipLink({
  item,
  accentColor = '#EA580C',
  layout = 'tile',
}: CategoryItemChipLinkProps) {
  const imageSrc = item.displayImageUrl ?? item.imageUrl;
  const isPoster = layout === 'poster';

  return (
    <Link
      href={`/items/${item.id}`}
      className={`shrink-0 text-start transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 active:scale-[0.97] ${
        isPoster ? 'w-[6.5rem]' : 'w-24'
      }`}
    >
      <div
        className={`overflow-hidden bg-wibe-card shadow-sm ring-1 ring-wibe/90 ${
          isPoster
            ? 'aspect-[2/3] rounded-xl'
            : 'aspect-square rounded-xl'
        }`}
      >
        {imageSrc ? (
          <ImageWithFallback
            src={imageSrc}
            alt={item.title}
            className="h-full w-full object-cover"
            placeholderSize={isPoster ? 'cover' : 'square'}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-wibe-surface text-2xl opacity-40"
            style={{ color: accentColor }}
          >
            {isPoster ? '🎬' : '📋'}
          </div>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 wibe-caption font-medium leading-snug text-foreground">
        {item.title}
      </p>
    </Link>
  );
}
