'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  SearchItemRow,
  SearchListRow,
  type SearchListRowData,
} from '@/components/mobile/search/SearchOverlayParts';
import SearchResultsSummary, {
  type SearchResultTab,
} from '@/components/mobile/search/SearchResultsSummary';
import type { UnifiedSearchHasMore, UnifiedSearchItem, UnifiedSearchList } from '@/lib/unified-search';
import type { SearchQueryIntent } from '@/lib/search-keywords';
import type { AreaFacet } from '@/lib/category-discovery/place-area';
import { normalizeDiscoveryText } from '@/lib/category-discovery/normalize';
import { searchHasLoadMore } from '@/lib/search-client';
import { Button } from '@/components/ui/button';
import SearchResultSkeleton from '@/components/mobile/search/SearchResultSkeleton';
import { fa } from '@/lib/utils';

type Props = {
  query: string;
  queryIntent?: SearchQueryIntent;
  directItems: UnifiedSearchItem[];
  indirectItems: UnifiedSearchItem[];
  topPicks?: UnifiedSearchItem[];
  subThemes?: string[];
  similarItems: UnifiedSearchItem[];
  lists: UnifiedSearchList[];
  areaFacets?: AreaFacet[];
  totals: { items: number; lists: number };
  hasMore: UnifiedSearchHasMore;
  viewTab: SearchResultTab;
  onTabChange: (tab: SearchResultTab) => void;
  onLoadMore?: () => void;
  onSubThemeClick?: (term: string) => void;
  loadingMore?: boolean;
  highlightQuery: string;
  showSummary?: boolean;
  compactSimilar?: boolean;
};

function filterByArea(items: UnifiedSearchItem[], area: string | null): UnifiedSearchItem[] {
  if (!area) return items;
  const key = normalizeDiscoveryText(area);
  return items.filter((i) => i.areaLabel && normalizeDiscoveryText(i.areaLabel) === key);
}

function toListRowData(list: UnifiedSearchList): SearchListRowData {
  return {
    id: list.id,
    title: list.title,
    slug: list.slug,
    coverImage: list.coverImage,
    categorySlug: list.categories?.slug ?? null,
    saveCount: list.saveCount ?? 0,
    itemCount: list.itemCount ?? 0,
    description: list.description,
    categories: list.categories,
  };
}

export default function SearchResultsPanel({
  query,
  queryIntent = 'specific',
  directItems,
  indirectItems,
  topPicks = [],
  subThemes = [],
  similarItems,
  lists,
  areaFacets = [],
  totals,
  hasMore,
  viewTab,
  onTabChange,
  onLoadMore,
  onSubThemeClick,
  loadingMore = false,
  highlightQuery,
  showSummary = true,
  compactSimilar = true,
}: Props) {
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  useEffect(() => {
    setAreaFilter(null);
  }, [query]);

  const filteredDirect = useMemo(
    () => filterByArea(directItems, areaFilter),
    [directItems, areaFilter]
  );
  const filteredIndirect = useMemo(
    () => filterByArea(indirectItems, areaFilter),
    [indirectItems, areaFilter]
  );
  const filteredTopPicks = useMemo(
    () => filterByArea(topPicks, areaFilter),
    [topPicks, areaFilter]
  );
  const filteredSimilar = useMemo(
    () => filterByArea(similarItems, areaFilter),
    [similarItems, areaFilter]
  );

  const isBroad = queryIntent === 'broad';
  const showItems = viewTab === 'items';
  const showLists = viewTab === 'lists';
  const shownTopPicks = filteredTopPicks.length;
  const shownItemCount = isBroad
    ? filteredDirect.length + filteredTopPicks.length + filteredSimilar.length
    : filteredDirect.length + filteredIndirect.length + filteredSimilar.length;
  const shownLists = lists.length;
  const canLoadMore = onLoadMore && searchHasLoadMore(hasMore, viewTab, queryIntent);

  const remainingItems = isBroad
    ? Math.max(0, totals.items - directItems.length - topPicks.length)
    : Math.max(0, totals.items - directItems.length - indirectItems.length);

  return (
    <div className="space-y-4">
      {showSummary && (
        <SearchResultsSummary
          query={query}
          totals={totals}
          shownItems={shownItemCount}
          shownLists={shownLists}
          shownTopPicks={shownTopPicks}
          queryIntent={queryIntent}
          activeTab={viewTab}
          onTabChange={onTabChange}
        />
      )}

      {isBroad && subThemes.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {subThemes.map((theme) => (
            <Button
              key={theme}
              type="button"
              variant="outline"
              size="sm"
              className="h-11 shrink-0 rounded-full"
              onClick={() => onSubThemeClick?.(theme)}
            >
              {theme}
            </Button>
          ))}
        </div>
      )}

      {showItems && areaFacets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setAreaFilter(null)}
            className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${
              !areaFilter
                ? 'border-brand/40 bg-brand/10 text-foreground'
                : 'border-border bg-popover text-muted-foreground'
            }`}
          >
            همه مناطق
          </button>
          {areaFacets.map((facet) => (
            <button
              key={facet.label}
              type="button"
              onClick={() =>
                setAreaFilter((prev) => (prev === facet.label ? null : facet.label))
              }
              className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium ${
                areaFilter === facet.label
                  ? 'border-brand/40 bg-brand/10 text-foreground'
                  : 'border-border bg-popover text-foreground'
              }`}
            >
              {facet.label}
              <span className="tabular-nums text-xs text-muted-foreground">{fa(facet.count)}</span>
            </button>
          ))}
        </div>
      )}

      {showLists && loadingMore && lists.length === 0 && (
        <SearchResultSkeleton rows={3} />
      )}

      {showLists && lists.length > 0 && (
        <section>
          <h2 className="mb-2 wibe-caption font-medium text-muted-foreground">
            {isBroad ? 'لیست‌های پیشنهادی' : 'لیست‌ها'}
            {totals.lists > lists.length && (
              <span className="ms-1 tabular-nums">({totals.lists.toLocaleString('fa-IR')})</span>
            )}
          </h2>
          <div className="space-y-2">
            {lists.map((list) => (
              <SearchListRow
                key={list.id}
                list={toListRowData(list)}
                highlightQuery={highlightQuery}
              />
            ))}
          </div>
        </section>
      )}

      {showItems && filteredDirect.length > 0 && (
        <section>
          <div className="space-y-2">
            {filteredDirect.map((item) => (
              <SearchItemRow key={item.id} item={item} highlightQuery={highlightQuery} variant="direct" />
            ))}
          </div>
        </section>
      )}

      {showItems && isBroad && filteredTopPicks.length > 0 && (
        <section>
          <h2 className="mb-2 wibe-caption font-medium text-muted-foreground">پیشنهادهای برتر</h2>
          <div className="space-y-2">
            {filteredTopPicks.map((item) => (
              <SearchItemRow
                key={item.id}
                item={item}
                highlightQuery={highlightQuery}
                variant="suggestion"
              />
            ))}
          </div>
        </section>
      )}

      {showItems && !isBroad && filteredIndirect.length > 0 && (
        <section>
          <h2 className="mb-2 wibe-caption font-medium text-muted-foreground">مرتبط با جستجو</h2>
          <div className="space-y-2">
            {filteredIndirect.map((item) => (
              <SearchItemRow key={item.id} item={item} highlightQuery={highlightQuery} />
            ))}
          </div>
        </section>
      )}

      {showItems && !isBroad && filteredSimilar.length > 0 && (
        <section>
          <h2 className="mb-2 wibe-caption font-medium text-muted-foreground">پیشنهاد مرتبط</h2>
          <div className="space-y-2">
            {filteredSimilar.map((item) => (
              <SearchItemRow
                key={`sim-${item.id}`}
                item={item}
                compact={compactSimilar}
                highlightQuery={highlightQuery}
              />
            ))}
          </div>
        </section>
      )}

      {showItems &&
        areaFilter &&
        filteredDirect.length + filteredIndirect.length + filteredTopPicks.length + filteredSimilar.length ===
          0 && (
          <p className="text-center text-sm text-muted-foreground">
            در «{areaFilter}» نتیجه‌ای نبود. فیلتر منطقه را بردار.
          </p>
        )}

      {showItems && remainingItems > 0 && !canLoadMore && (
        <p className="text-center wibe-caption text-muted-foreground">
          {isBroad ? (
            <>
              +{remainingItems.toLocaleString('fa-IR')} مورد دیگر — از لیست‌ها یا جستجوی دقیق‌تر کاوش
              کن
            </>
          ) : (
            <>
              {remainingItems.toLocaleString('fa-IR')} آیتم دیگر — جستجو را دقیق‌تر کنید
            </>
          )}
        </p>
      )}

      {canLoadMore && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore
            ? 'در حال بارگذاری…'
            : isBroad
              ? 'لیست‌های بیشتر'
              : 'بارگذاری بیشتر'}
        </Button>
      )}
    </div>
  );
}

export type { SearchResultTab };
