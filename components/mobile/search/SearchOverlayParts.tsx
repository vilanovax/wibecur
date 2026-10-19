'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import SearchHighlight from '@/components/mobile/search/SearchHighlight';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import { getDisplayListTitle } from '@/lib/list-display-title';
import type { UnifiedSearchItem } from '@/lib/unified-search';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type SearchListRowData = {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  categorySlug?: string | null;
  saveCount?: number;
  itemCount?: number;
  description?: string | null;
  categories?: { name: string; icon?: string | null; slug?: string | null } | null;
  category?: { name: string; icon?: string | null; slug?: string | null } | null;
  matchedItemTitle?: string | null;
  matchHint?: string | null;
};

export function SearchListRow({
  list,
  onClick,
  highlightQuery,
  isActive,
  innerRef,
}: {
  list: SearchListRowData;
  onClick?: () => void;
  highlightQuery?: string;
  isActive?: boolean;
  innerRef?: (el: HTMLAnchorElement | null) => void;
}) {
  const subtitle = getListCardSubtitle(list);
  const categorySlug =
    list.categorySlug ?? list.categories?.slug ?? list.category?.slug ?? null;
  const fallbackIcon = list.categories?.icon ?? list.category?.icon ?? '📋';
  const displayTitle = getDisplayListTitle({
    title: list.title,
    slug: list.slug,
    categorySlug,
  });

  return (
    <Link
      ref={innerRef}
      href={`/lists/${list.slug}`}
      onClick={onClick}
      className="block"
    >
      <Card
        className={`flex min-w-0 gap-2.5 p-2 transition-transform active:scale-95 ${
          isActive ? 'border-primary bg-primary/5 ring-2 ring-primary/25' : 'bg-popover'
        }`}
      >
      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        <ListCoverImage
          coverImage={list.coverImage}
          title={displayTitle}
          slug={list.slug}
          categorySlug={categorySlug}
          className="h-full w-full object-cover"
          fallbackIcon={fallbackIcon}
          fallbackClassName="flex h-full w-full items-center justify-center text-lg sm:text-xl"
        />
      </div>
      <div className="min-w-0 flex-1 text-start">
        <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-foreground">
          {highlightQuery ? (
            <SearchHighlight text={displayTitle} query={highlightQuery} />
          ) : (
            displayTitle
          )}
        </h3>
        {list.matchedItemTitle && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-primary/90">
            شامل:{' '}
            {highlightQuery ? (
              <SearchHighlight text={list.matchedItemTitle} query={highlightQuery} />
            ) : (
              list.matchedItemTitle
            )}
          </p>
        )}
        {!list.matchedItemTitle && list.matchHint && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-primary/90">{list.matchHint}</p>
        )}
        {subtitle && !list.matchedItemTitle && !list.matchHint && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-muted-foreground">
            {highlightQuery ? (
              <SearchHighlight text={subtitle} query={highlightQuery} />
            ) : (
              subtitle
            )}
          </p>
        )}
        {subtitle && list.matchedItemTitle && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-muted-foreground">{subtitle}</p>
        )}
        {subtitle && !list.matchedItemTitle && list.matchHint && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-muted-foreground">{subtitle}</p>
        )}
        <ListCardStats
          saves={list.saveCount ?? 0}
          itemCount={list.itemCount ?? 0}
          variant="minimal"
          className="mt-1"
        />
      </div>
      </Card>
    </Link>
  );
}

export function SearchItemRow({
  item,
  onClick,
  highlightQuery,
  isActive,
  innerRef,
  compact = false,
  variant = 'default',
}: {
  item: UnifiedSearchItem;
  onClick?: () => void;
  highlightQuery?: string;
  isActive?: boolean;
  innerRef?: (el: HTMLAnchorElement | null) => void;
  compact?: boolean;
  variant?: 'default' | 'direct' | 'suggestion';
}) {
  const fallbackIcon = item.categoryIcon ?? '🎬';
  const isDirect = variant === 'direct';
  const isSuggestion = variant === 'suggestion';

  const meta =
    item.listTitle && item.categoryName
      ? `${item.categoryIcon ? `${item.categoryIcon} ` : ''}${item.categoryName} · ${item.listTitle}`
      : item.categoryName
        ? `${item.categoryIcon ? `${item.categoryIcon} ` : ''}${item.categoryName}`
        : item.listTitle ?? null;
  const directMeta = item.listTitle
    ? `${item.categoryIcon ? `${item.categoryIcon} ` : ''}${item.listTitle}`
    : null;
  const displayMeta = isDirect ? directMeta : meta;

  const surfaceClass = isActive
    ? 'border-primary bg-primary/5 ring-2 ring-primary/25'
    : isDirect
      ? 'border-brand/30 bg-brand/5'
      : isSuggestion
        ? 'bg-muted'
        : 'bg-popover';

  return (
    <Link
      ref={innerRef}
      href={`/items/${item.id}`}
      onClick={onClick}
      className="block"
    >
      <Card
        className={`flex min-w-0 gap-2.5 p-2 transition-transform active:scale-95 ${surfaceClass}`}
      >
      <div
        className={`shrink-0 overflow-hidden rounded-xl bg-muted ${
          compact ? 'size-14' : 'size-16'
        }`}
      >
        <ImageWithFallback
          src={item.imageUrl ?? ''}
          alt={item.title}
          className="h-full w-full object-cover"
          fallbackIcon={fallbackIcon}
          fallbackClassName="flex h-full w-full items-center justify-center text-lg"
        />
      </div>
      <div className="min-w-0 flex-1 text-start">
        <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-foreground">
          {highlightQuery ? (
            <SearchHighlight text={item.title} query={highlightQuery} />
          ) : (
            item.title
          )}
        </h3>
        {item.matchHint && !isDirect && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-primary/90">{item.matchHint}</p>
        )}
        {displayMeta && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-muted-foreground">{displayMeta}</p>
        )}
      </div>
      </Card>
    </Link>
  );
}

/** ردیف افقی chip — اسکرول لمسی موبایل */
export function SearchChipScroller({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`-mx-2.5 flex gap-2 overflow-x-auto px-2.5 pb-0.5 scrollbar-hide snap-x snap-mandatory ${className}`}
    >
      {children}
    </div>
  );
}

export function SearchChipButton({
  children,
  onClick,
  variant = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary';
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={variant === 'primary' ? 'secondary' : 'outline'}
      size="sm"
      className="h-11 snap-start shrink-0 rounded-full"
    >
      {children}
    </Button>
  );
}
