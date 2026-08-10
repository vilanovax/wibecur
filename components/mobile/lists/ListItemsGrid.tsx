'use client';

import { memo, useEffect, useState } from 'react';
import { useLazyInView } from '@/hooks/useLazyInView';
import LightweightEntryRow from '@/components/shared/list-entries/LightweightEntryRow';
import ListGridItemCard from '@/components/mobile/lists/ListGridItemCard';
import {
  isLightweightListItem,
  resolveEntryKind,
  sourceCategorySlugFromItem,
  type EntryKind,
} from '@/lib/list-entry';

const GRID_BATCH_THRESHOLD = 20;
const GRID_INITIAL_VISIBLE = 16;
const GRID_LOAD_MORE = 12;

export type ListGridEntry = {
  item: {
    id: string;
    title: string;
    description?: string | null;
    imageUrl: string | null;
    displayImageUrl?: string | null;
    metadata?: Record<string, unknown> | null;
    externalUrl?: string | null;
    catalogItemId?: string | null;
    listNote?: string | null;
    rating?: number;
  };
  originalIndex: number;
};

type ListItemsGridProps = {
  entries: ListGridEntry[];
  listCategorySlug?: string | null;
  categoryIcon?: string | null;
  isLifestyleList: boolean;
  onOpenAt: (index: number) => void;
};

function itemCategorySlug(
  item: ListGridEntry['item'],
  listCategorySlug?: string | null
): string | null {
  return sourceCategorySlugFromItem(item) ?? listCategorySlug ?? null;
}

const LightweightGridCard = memo(function LightweightGridCard({
  item,
  index,
  entryKind,
  categorySlug,
  onOpenAt,
  hideEntryKindChrome = false,
}: {
  item: ListGridEntry['item'];
  index: number;
  entryKind: EntryKind;
  categorySlug?: string | null;
  onOpenAt: (index: number) => void;
  hideEntryKindChrome?: boolean;
}) {
  return (
    <LightweightEntryRow
      item={item}
      index={index}
      entryKind={entryKind}
      categorySlug={categorySlug}
      onOpen={() => onOpenAt(index)}
      compact={!hideEntryKindChrome}
      hideEntryKindChrome={hideEntryKindChrome}
    />
  );
});

function ListItemsGrid({
  entries,
  listCategorySlug,
  categoryIcon,
  isLifestyleList,
  onOpenAt,
}: ListItemsGridProps) {
  const useBatching = entries.length > GRID_BATCH_THRESHOLD;
  const [visibleCount, setVisibleCount] = useState(() =>
    useBatching ? GRID_INITIAL_VISIBLE : entries.length
  );
  const { ref: sentinelRef, inView: sentinelInView } = useLazyInView<HTMLDivElement>({
    rootMargin: '360px',
    once: false,
  });

  useEffect(() => {
    setVisibleCount(useBatching ? GRID_INITIAL_VISIBLE : entries.length);
  }, [entries, useBatching]);

  useEffect(() => {
    if (!useBatching || !sentinelInView || visibleCount >= entries.length) return;
    setVisibleCount((current) => Math.min(current + GRID_LOAD_MORE, entries.length));
  }, [sentinelInView, useBatching, visibleCount, entries.length]);

  const visibleEntries = useBatching ? entries.slice(0, visibleCount) : entries;
  const hasMore = useBatching && visibleCount < entries.length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
      {visibleEntries.map(({ item, originalIndex }) => {
        const entryKind = resolveEntryKind(item);
        const slug = itemCategorySlug(item, listCategorySlug);
        // Skip paint for offscreen cards; keep first row eager so posters aren't stuck
        // behind content-visibility + IntersectionObserver races.
        const paintClass =
          originalIndex < 8
            ? ''
            : '[content-visibility:auto] [contain-intrinsic-size:auto_17.5rem]';

        if (isLightweightListItem(item)) {
          const spanClass = isLifestyleList
            ? 'col-span-2'
            : 'col-span-2 sm:col-span-1';
          return (
            <div key={item.id} className={`${spanClass} ${paintClass}`}>
              <LightweightGridCard
                item={item}
                index={originalIndex}
                entryKind={entryKind}
                categorySlug={slug}
                onOpenAt={onOpenAt}
                hideEntryKindChrome={isLifestyleList}
              />
            </div>
          );
        }

        return (
          <div key={item.id} className={paintClass}>
            <ListGridItemCard
              item={item}
              index={originalIndex}
              categorySlug={slug}
              categoryIcon={categoryIcon}
              onOpenAt={onOpenAt}
            />
          </div>
        );
      })}
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="col-span-2 flex h-10 items-center justify-center lg:col-span-full"
          aria-hidden
        >
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : null}
    </div>
  );
}

export default memo(ListItemsGrid);
