'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchUnifiedSearch,
  mergeSearchItems,
  mergeSearchLists,
  SEARCH_DEFAULT_LIMITS,
  type SearchFetchParams,
} from '@/lib/search-client';
import { normalizeSearchQuery, SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from '@/lib/list-search';
import type { UnifiedSearchHasMore, UnifiedSearchItem, UnifiedSearchList } from '@/lib/unified-search';
import type { SearchQueryIntent } from '@/lib/search-keywords';
import type { SearchResultTab } from '@/components/mobile/search/SearchResultsSummary';

const EMPTY_HAS_MORE: UnifiedSearchHasMore = {
  directItems: false,
  indirectItems: false,
  lists: false,
};

type Limits = Pick<
  SearchFetchParams,
  'listLimit' | 'directItemLimit' | 'indirectItemLimit' | 'relatedLimit'
>;

type Options = {
  limits?: Limits;
  debounceMs?: number;
  enabled?: boolean;
};

export function useUnifiedSearchQuery(rawQuery: string, options?: Options) {
  const limits = options?.limits ?? SEARCH_DEFAULT_LIMITS;
  const debounceMs = options?.debounceMs ?? SEARCH_DEBOUNCE_MS;
  const enabled = options?.enabled ?? true;

  const [directItems, setDirectItems] = useState<UnifiedSearchItem[]>([]);
  const [indirectItems, setIndirectItems] = useState<UnifiedSearchItem[]>([]);
  const [topPicks, setTopPicks] = useState<UnifiedSearchItem[]>([]);
  const [subThemes, setSubThemes] = useState<string[]>([]);
  const [queryIntent, setQueryIntent] = useState<SearchQueryIntent>('specific');
  const [similarItems, setSimilarItems] = useState<UnifiedSearchItem[]>([]);
  const [lists, setLists] = useState<UnifiedSearchList[]>([]);
  const [totals, setTotals] = useState({ items: 0, lists: 0 });
  const [hasMore, setHasMore] = useState<UnifiedSearchHasMore>(EMPTY_HAS_MORE);
  const [viewTab, setViewTab] = useState<SearchResultTab>('all');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const countsRef = useRef({ direct: 0, indirect: 0, lists: 0 });
  const queryIntentRef = useRef<SearchQueryIntent>('specific');
  const limitsRef = useRef(limits);
  limitsRef.current = limits;

  countsRef.current = {
    direct: directItems.length,
    indirect: indirectItems.length,
    lists: lists.length,
  };

  const normalized = normalizeSearchQuery(rawQuery);
  const isActive = enabled && normalized.length >= SEARCH_MIN_LENGTH;
  const hasResults =
    directItems.length > 0 ||
    indirectItems.length > 0 ||
    topPicks.length > 0 ||
    lists.length > 0 ||
    similarItems.length > 0;

  const resetResults = useCallback(() => {
    setDirectItems([]);
    setIndirectItems([]);
    setTopPicks([]);
    setSubThemes([]);
    setQueryIntent('specific');
    queryIntentRef.current = 'specific';
    setSimilarItems([]);
    setLists([]);
    setTotals({ items: 0, lists: 0 });
    setHasMore(EMPTY_HAS_MORE);
    setViewTab('all');
  }, []);

  const fetchResults = useCallback(
    async (raw: string, append: boolean) => {
      const q = normalizeSearchQuery(raw);
      if (!enabled || q.length < SEARCH_MIN_LENGTH) {
        resetResults();
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (append) setLoadingMore(true);
      else setLoading(true);

      const offsets =
        append && queryIntentRef.current === 'broad'
          ? { listOffset: countsRef.current.lists, directItemOffset: 0, indirectItemOffset: 0 }
          : append
            ? {
                listOffset: countsRef.current.lists,
                directItemOffset: countsRef.current.direct,
                indirectItemOffset: countsRef.current.indirect,
              }
            : { listOffset: 0, directItemOffset: 0, indirectItemOffset: 0 };

      try {
        const data = await fetchUnifiedSearch(
          {
            q,
            ...limitsRef.current,
            ...offsets,
            relatedLimit: append ? 0 : limitsRef.current.relatedLimit,
          },
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        if (!data) {
          if (!append) resetResults();
          return;
        }

        if (append) {
          if (data.queryIntent === 'broad') {
            setLists((prev) => mergeSearchLists(prev, data.lists));
          } else {
            setDirectItems((prev) => mergeSearchItems(prev, data.directItems));
            setIndirectItems((prev) => mergeSearchItems(prev, data.indirectItems));
            setLists((prev) => mergeSearchLists(prev, data.lists));
          }
        } else {
          setDirectItems(data.directItems);
          setIndirectItems(data.indirectItems);
          setTopPicks(data.topPicks ?? []);
          setSubThemes(data.subThemes ?? []);
          setQueryIntent(data.queryIntent);
          queryIntentRef.current = data.queryIntent;
          setSimilarItems(data.relatedItems ?? data.similarItems ?? []);
          setLists(data.lists);
        }
        setTotals(data.totals);
        setHasMore(data.hasMore);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (!append) resetResults();
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [enabled, resetResults]
  );

  useEffect(() => {
    setViewTab('all');
  }, [normalized]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (!enabled) {
      resetResults();
      setLoading(false);
      return;
    }

    const q = normalizeSearchQuery(rawQuery);
    if (q.length < SEARCH_MIN_LENGTH) {
      resetResults();
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(() => {
      void fetchResults(rawQuery, false);
    }, debounceMs);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [rawQuery, enabled, debounceMs, fetchResults, resetResults]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const loadMore = useCallback(() => {
    void fetchResults(rawQuery, true);
  }, [fetchResults, rawQuery]);

  const refetch = useCallback(() => {
    void fetchResults(rawQuery, false);
  }, [fetchResults, rawQuery]);

  return {
    normalized,
    isActive,
    directItems,
    indirectItems,
    topPicks,
    subThemes,
    queryIntent,
    similarItems,
    lists,
    totals,
    hasMore,
    viewTab,
    setViewTab,
    loading,
    loadingMore,
    hasResults,
    loadMore,
    refetch,
    resetResults,
  };
}
