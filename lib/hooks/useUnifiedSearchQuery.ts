'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchUnifiedSearch,
  mergeSearchItems,
  mergeSearchLists,
  SEARCH_ITEMS_ONLY_LIMITS,
  SEARCH_LISTS_ONLY_LIMITS,
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

type SearchScope = 'items' | 'lists';

type Options = {
  debounceMs?: number;
  enabled?: boolean;
};

export function useUnifiedSearchQuery(rawQuery: string, options?: Options) {
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
  const [viewTab, setViewTab] = useState<SearchResultTab>('items');
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const listsAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const listsLoadedForRef = useRef('');
  const queryIntentRef = useRef<SearchQueryIntent>('specific');

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
    setViewTab('items');
    listsLoadedForRef.current = '';
  }, []);

  const fetchScope = useCallback(
    async (raw: string, scope: SearchScope, signal: AbortSignal) => {
      const q = normalizeSearchQuery(raw);
      const limits: SearchFetchParams =
        scope === 'lists' ? { q, ...SEARCH_LISTS_ONLY_LIMITS } : { q, ...SEARCH_ITEMS_ONLY_LIMITS };

      const data = await fetchUnifiedSearch(limits, { signal });
      if (!data || signal.aborted) return null;
      return data;
    },
    []
  );

  const fetchItems = useCallback(
    async (raw: string) => {
      const q = normalizeSearchQuery(raw);
      if (!enabled || q.length < SEARCH_MIN_LENGTH) {
        resetResults();
        setLoading(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      listsLoadedForRef.current = '';

      try {
        const data = await fetchScope(raw, 'items', controller.signal);
        if (controller.signal.aborted) return;

        if (!data) {
          resetResults();
          return;
        }

        setDirectItems(data.directItems);
        setIndirectItems(data.indirectItems);
        setTopPicks(data.topPicks ?? []);
        setSubThemes(data.subThemes ?? []);
        setQueryIntent(data.queryIntent);
        queryIntentRef.current = data.queryIntent;
        setSimilarItems(data.relatedItems ?? data.similarItems ?? []);
        setLists([]);
        setTotals((prev) => ({ items: data.totals.items, lists: prev.lists || 0 }));
        setHasMore((prev) => ({
          directItems: data.hasMore.directItems,
          indirectItems: data.hasMore.indirectItems,
          lists: prev.lists,
        }));
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        resetResults();
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [enabled, fetchScope, resetResults]
  );

  const fetchLists = useCallback(
    async (raw: string) => {
      const q = normalizeSearchQuery(raw);
      if (!enabled || q.length < SEARCH_MIN_LENGTH) return;
      if (listsLoadedForRef.current === q) return;

      listsAbortRef.current?.abort();
      const controller = new AbortController();
      listsAbortRef.current = controller;
      setLoadingLists(true);

      try {
        const data = await fetchScope(raw, 'lists', controller.signal);
        if (controller.signal.aborted) return;
        if (!data) return;

        setLists(data.lists);
        listsLoadedForRef.current = q;
        setTotals((prev) => ({ items: prev.items, lists: data.totals.lists }));
        setHasMore((prev) => ({
          ...prev,
          lists: data.hasMore.lists,
        }));
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      } finally {
        if (!controller.signal.aborted) setLoadingLists(false);
      }
    },
    [enabled, fetchScope]
  );

  useEffect(() => {
    setViewTab('items');
    listsLoadedForRef.current = '';
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
      void fetchItems(rawQuery);
    }, debounceMs);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [rawQuery, enabled, debounceMs, fetchItems, resetResults]);

  useEffect(() => {
    if (!isActive || viewTab !== 'lists') return;
    void fetchLists(rawQuery);
  }, [isActive, viewTab, rawQuery, fetchLists]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      listsAbortRef.current?.abort();
    };
  }, []);

  const refetch = useCallback(() => {
    listsLoadedForRef.current = '';
    void fetchItems(rawQuery);
    if (viewTab === 'lists') void fetchLists(rawQuery);
  }, [fetchItems, fetchLists, rawQuery, viewTab]);

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
    loadingMore: loadingLists,
    hasResults,
    refetch,
    resetResults,
  };
}
