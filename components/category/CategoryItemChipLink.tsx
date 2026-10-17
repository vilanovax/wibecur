'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Card } from '@/components/ui/card';
import type { CategoryItemCard } from '@/types/category-page';

interface CategoryItemChipLinkProps {
  item: CategoryItemCard;
  accentColor?: string;
}

export default function CategoryItemChipLink({
  item,
}: CategoryItemChipLinkProps) {
  const imageSrc = item.displayImageUrl ?? item.imageUrl;

  return (
    <Link
      href={`/items/${item.id}`}
      className="w-24 shrink-0 transition-transform active:scale-[0.97]"
    >
      <Card className="aspect-square overflow-hidden bg-popover p-0">
        {imageSrc ? (
          <ImageWithFallback
            src={imageSrc}
            alt={item.title}
            className="h-full w-full object-cover"
            placeholderSize="square"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-2xl opacity-40">
            📋
          </div>
        )}
      </Card>
      <p className="mt-1.5 line-clamp-2 wibe-caption font-medium leading-tight text-foreground">
        {item.title}
      </p>
    </Link>
  );
}
