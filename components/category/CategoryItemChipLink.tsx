'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryItemCard } from '@/types/category-page';

interface CategoryItemChipLinkProps {
  item: CategoryItemCard;
  accentColor?: string;
}

export default function CategoryItemChipLink({
  item,
  accentColor = '#EA580C',
}: CategoryItemChipLinkProps) {
  const imageSrc = item.displayImageUrl ?? item.imageUrl;

  return (
    <Link
      href={`/items/${item.id}`}
      className="w-24 shrink-0 transition-transform active:scale-[0.97]"
    >
      <div className="aspect-square overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm">
        {imageSrc ? (
          <ImageWithFallback
            src={imageSrc}
            alt={item.title}
            className="h-full w-full object-cover"
            placeholderSize="square"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-2xl opacity-40"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            📋
          </div>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 wibe-caption font-medium leading-tight text-foreground">
        {item.title}
      </p>
    </Link>
  );
}
