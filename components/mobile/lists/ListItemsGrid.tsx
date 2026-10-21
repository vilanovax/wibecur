'use client';

import { memo } from 'react';
import LightweightEntryRow from '@/components/shared/list-entries/LightweightEntryRow';
import ListGridItemCard from '@/components/mobile/lists/ListGridItemCard';
import {
  isLightweightListItem,
  resolveEntryKind,
  sourceCategorySlugFromItem,
  type EntryKind,
} from '@/lib/list-entry';

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
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
      {entries.map(({ item, originalIndex }) => {
        const entryKind = resolveEntryKind(item);
        const slug = itemCategorySlug(item, listCategorySlug);

        if (isLightweightListItem(item)) {
          const spanClass = isLifestyleList
            ? 'col-span-2'
            : 'col-span-2 sm:col-span-1';
          return (
            <div key={item.id} className={spanClass}>
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
          <div key={item.id}>
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
    </div>
  );
}

export default memo(ListItemsGrid);
