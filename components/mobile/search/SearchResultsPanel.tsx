'use client';

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
import { searchHasLoadMore } from '@/lib/search-client';

type Props = {
  query: string;
  queryIntent?: SearchQueryIntent;
  directItems: UnifiedSearchItem[];
  indirectItems: UnifiedSearchItem[];
  topPicks?: UnifiedSearchItem[];
  subThemes?: string[];
  similarItems: UnifiedSearchItem[];
  lists: UnifiedSearchList[];
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
  const isBroad = queryIntent === 'broad';
  const showItems = viewTab === 'items';
  const showLists = viewTab === 'lists';
  const shownTopPicks = topPicks.length;
  const shownItemCount = isBroad
    ? directItems.length + topPicks.length + similarItems.length
    : directItems.length + indirectItems.length + similarItems.length;
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
            <button
              key={theme}
              type="button"
              onClick={() => onSubThemeClick?.(theme)}
              className="h-8 shrink-0 rounded-full border border-wibe bg-wibe-card px-3.5 wibe-caption font-medium text-foreground transition-colors active:scale-[0.98] hover:border-primary/40"
            >
              {theme}
            </button>
          ))}
        </div>
      )}

      {showLists && loadingMore && lists.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-wibe p-2.5">
              <div className="h-[72px] w-[72px] animate-pulse rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showLists && lists.length > 0 && (
        <section>
          <h2 className="mb-2 wibe-caption font-medium text-wibe-secondary">
            {isBroad ? 'لیست‌های پیشنهادی' : 'لیست‌ها'}
            {totals.lists > lists.length && (
              <span className="mr-1 tabular-nums">({totals.lists.toLocaleString('fa-IR')})</span>
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

      {showItems && directItems.length > 0 && (
        <section>
          <div className="space-y-2">
            {directItems.map((item) => (
              <SearchItemRow key={item.id} item={item} highlightQuery={highlightQuery} variant="direct" />
            ))}
          </div>
        </section>
      )}

      {showItems && isBroad && topPicks.length > 0 && (
        <section>
          <h2 className="mb-2 wibe-caption font-medium text-wibe-secondary">پیشنهادهای برتر</h2>
          <div className="space-y-2">
            {topPicks.map((item) => (
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

      {showItems && !isBroad && indirectItems.length > 0 && (
        <section>
          <h2 className="mb-2 wibe-caption font-medium text-wibe-secondary">مرتبط با جستجو</h2>
          <div className="space-y-2">
            {indirectItems.map((item) => (
              <SearchItemRow key={item.id} item={item} highlightQuery={highlightQuery} />
            ))}
          </div>
        </section>
      )}

      {showItems && !isBroad && similarItems.length > 0 && (
        <section>
          <h2 className="mb-2 wibe-caption font-medium text-wibe-secondary">پیشنهاد مرتبط</h2>
          <div className="space-y-2">
            {similarItems.map((item) => (
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

      {showItems && remainingItems > 0 && !canLoadMore && (
        <p className="text-center wibe-caption text-wibe-secondary">
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
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full rounded-xl border border-primary/25 bg-primary/5 py-3 wibe-small font-semibold text-primary transition-transform active:scale-[0.99] disabled:opacity-60"
        >
          {loadingMore
            ? 'در حال بارگذاری…'
            : isBroad
              ? 'لیست‌های بیشتر'
              : 'بارگذاری بیشتر'}
        </button>
      )}
    </div>
  );
}

export type { SearchResultTab };
