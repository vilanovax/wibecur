'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCategoryIconTile from '@/components/shared/ListCategoryIconTile';
import type { CategoryListCard } from '@/types/category-page';
import { Card } from '@/components/ui/card';

interface CategoryListCardImprovedProps {
  list: CategoryListCard;
  accentColor?: string;
  categorySlug?: string | null;
  categoryIcon?: string | null;
}

export default function CategoryListCardImproved({
  list,
  categoryIcon,
}: CategoryListCardImprovedProps) {
  return (
    <Link href={`/lists/${list.slug}`} className="block">
      <Card className="flex gap-3 bg-popover p-3">
        <ListCategoryIconTile icon={categoryIcon} size="md" />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            {list.creator?.image ? (
              <ImageWithFallback
                src={list.creator.image}
                alt={list.creator.name || ''}
                width={20}
                height={20}
                className="size-5 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                {(list.creator?.name || '?')[0]}
              </div>
            )}
            <span className="wibe-caption truncate text-wibe-secondary">
              {list.creator?.name || 'کاربر'}
            </span>
            {list.cityTag && (
              <span className="wibe-caption rounded-md bg-wibe-surface px-1.5 py-0.5 text-wibe-secondary">
                {list.cityTag}
              </span>
            )}
          </div>
          <h3 className="wibe-small line-clamp-2 font-semibold text-foreground">
            {list.title}
          </h3>
        </div>
      </Card>
    </Link>
  );
}
