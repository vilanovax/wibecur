'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import SearchHighlight from '@/components/mobile/search/SearchHighlight';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import { getDisplayListTitle } from '@/lib/list-display-title';
import type { UnifiedSearchItem } from '@/lib/unified-search';

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
      className={`flex min-w-0 flex-row-reverse gap-2.5 rounded-xl border p-2 transition-transform active:scale-[0.99] ${
        isActive
          ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/25'
          : 'border-wibe bg-wibe-card'
      }`}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-[72px] sm:w-[72px]">
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
      <div className="min-w-0 flex-1 text-right">
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
          <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">
            {highlightQuery ? (
              <SearchHighlight text={subtitle} query={highlightQuery} />
            ) : (
              subtitle
            )}
          </p>
        )}
        {subtitle && list.matchedItemTitle && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">{subtitle}</p>
        )}
        {subtitle && !list.matchedItemTitle && list.matchHint && (
          <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">{subtitle}</p>
        )}
        <ListCardStats
          saves={list.saveCount ?? 0}
          itemCount={list.itemCount ?? 0}
          variant="minimal"
          className="mt-1"
        />
      </div>
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
    ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/25'
    : isDirect
      ? 'border-amber-200/35 bg-amber-50/30'
      : isSuggestion
        ? 'border-wibe/80 bg-wibe-card/60'
        : 'border-wibe bg-wibe-card';

  return (
    <Link
      ref={innerRef}
      href={`/items/${item.id}`}
      onClick={onClick}
      className={`flex min-w-0 flex-row-reverse gap-2.5 rounded-xl border p-2 transition-transform active:scale-[0.99] ${surfaceClass} ${
        compact ? 'p-1.5' : ''
      }`}
    >
      <div
        className={`shrink-0 overflow-hidden rounded-lg bg-wibe-surface ${
          compact ? 'h-14 w-14' : 'h-16 w-16 sm:h-[72px] sm:w-[72px]'
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
      <div className="min-w-0 flex-1 text-right">
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
          <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">{displayMeta}</p>
        )}
      </div>
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
  const base =
    'snap-start shrink-0 rounded-full border px-3 py-2 wibe-caption font-medium transition-transform active:scale-[0.98] min-h-[40px]';
  const styles =
    variant === 'primary'
      ? 'border-primary/20 bg-primary/5 text-primary'
      : 'border-wibe bg-wibe-card text-foreground shadow-sm';

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
