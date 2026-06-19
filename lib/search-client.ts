import type { UnifiedSearchHasMore, UnifiedSearchList, UnifiedSearchItem } from '@/lib/unified-search';
import type { SearchQueryIntent } from '@/lib/search-keywords';

export const SEARCH_DEFAULT_LIMITS = {
  listLimit: 24,
  directItemLimit: 12,
  indirectItemLimit: 16,
  relatedLimit: 8,
} as const;

export const SEARCH_OVERLAY_LIMITS = {
  listLimit: 12,
  directItemLimit: 8,
  indirectItemLimit: 10,
  relatedLimit: 8,
} as const;

export type UnifiedSearchPayload = {
  query: string;
  queryIntent: SearchQueryIntent;
  items: UnifiedSearchItem[];
  directItems: UnifiedSearchItem[];
  indirectItems: UnifiedSearchItem[];
  topPicks: UnifiedSearchItem[];
  subThemes: string[];
  lists: UnifiedSearchList[];
  directLists: UnifiedSearchList[];
  indirectLists: UnifiedSearchList[];
  relatedItems: UnifiedSearchItem[];
  similarItems: UnifiedSearchItem[];
  totals: { items: number; lists: number };
  hasMore: UnifiedSearchHasMore;
};

export type SearchFetchParams = {
  q: string;
  listLimit?: number;
  listOffset?: number;
  directItemLimit?: number;
  directItemOffset?: number;
  indirectItemLimit?: number;
  indirectItemOffset?: number;
  relatedLimit?: number;
};

export function buildSearchApiUrl(params: SearchFetchParams): string {
  const sp = new URLSearchParams();
  sp.set('q', params.q);
  if (params.listLimit != null) sp.set('listLimit', String(params.listLimit));
  if (params.listOffset != null) sp.set('listOffset', String(params.listOffset));
  if (params.directItemLimit != null) sp.set('directItemLimit', String(params.directItemLimit));
  if (params.directItemOffset != null) sp.set('directItemOffset', String(params.directItemOffset));
  if (params.indirectItemLimit != null) sp.set('indirectItemLimit', String(params.indirectItemLimit));
  if (params.indirectItemOffset != null) sp.set('indirectItemOffset', String(params.indirectItemOffset));
  if (params.relatedLimit != null) sp.set('relatedLimit', String(params.relatedLimit));
  return `/api/search?${sp.toString()}`;
}

export async function fetchUnifiedSearch(
  params: SearchFetchParams,
  options?: { signal?: AbortSignal }
): Promise<UnifiedSearchPayload | null> {
  const res = await fetch(buildSearchApiUrl(params), { signal: options?.signal });
  const json = (await res.json()) as { success?: boolean; data?: UnifiedSearchPayload };
  if (!json.success || !json.data) return null;
  return {
    ...json.data,
    queryIntent: json.data.queryIntent ?? 'specific',
    topPicks: json.data.topPicks ?? [],
    subThemes: json.data.subThemes ?? [],
    hasMore: json.data.hasMore ?? {
      directItems: false,
      indirectItems: false,
      lists: false,
    },
  };
}

export function mergeSearchLists(
  prev: UnifiedSearchList[],
  next: UnifiedSearchList[]
): UnifiedSearchList[] {
  const seen = new Set(prev.map((l) => l.id));
  const out = [...prev];
  for (const list of next) {
    if (seen.has(list.id)) continue;
    seen.add(list.id);
    out.push(list);
  }
  return out;
}

export function mergeSearchItems(
  prev: UnifiedSearchItem[],
  next: UnifiedSearchItem[]
): UnifiedSearchItem[] {
  const seen = new Set(prev.map((i) => i.id));
  const out = [...prev];
  for (const item of next) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export function searchHasLoadMore(
  hasMore: UnifiedSearchHasMore,
  tab: 'all' | 'items' | 'lists',
  queryIntent: SearchQueryIntent = 'specific'
): boolean {
  if (queryIntent === 'broad') {
    if (tab === 'items') return false;
    return hasMore.lists;
  }
  if (tab === 'items') return hasMore.directItems || hasMore.indirectItems;
  if (tab === 'lists') return hasMore.lists;
  return hasMore.directItems || hasMore.indirectItems || hasMore.lists;
}
