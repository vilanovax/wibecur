'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import type { CategoryListCard } from '@/types/category-page';
import { Card } from '@/components/ui/card';

interface CategoryListCardImprovedProps {
  list: CategoryListCard;
  accentColor?: string;
  categorySlug?: string | null;
}

export default function CategoryListCardImproved({
  list,
  categorySlug,
}: CategoryListCardImprovedProps) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      className="block"
    >
      <Card className="flex gap-3 bg-popover p-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
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
          <span className="absolute end-1 top-1 rounded-full bg-warning px-1.5 py-0.5 text-xs font-semibold text-foreground">
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
              className="size-5 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
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
      </Card>
    </Link>
  );
}
