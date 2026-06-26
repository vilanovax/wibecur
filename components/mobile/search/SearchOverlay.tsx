'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, Flame, Search } from 'lucide-react';
import SearchInput from '@/components/mobile/search/SearchInput';
import {
  clearRecentSearches,
  normalizeSearchQuery,
  pushRecentSearch,
  readRecentSearches,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_LENGTH,
  SEARCH_SUGGESTIONS,
  suggestionLabelForQuery,
} from '@/lib/list-search';
import { trackSearch, trackSearchNoResults, trackSearchResultClick } from '@/lib/analytics';
import { withResolvedListCover } from '@/lib/resolve-list-cover';
import { DESKTOP_PAGE_MAX_WIDTH_CLASS } from '@/lib/layout-tokens';
import {
  SearchChipButton,
  SearchChipScroller,
  SearchItemRow,
  SearchListRow,
  type SearchListRowData,
} from '@/components/mobile/search/SearchOverlayParts';
import SearchResultsSummary, {
  type SearchResultTab,
} from '@/components/mobile/search/SearchResultsSummary';
import {
  fetchUnifiedSearch,
  SEARCH_ITEMS_ONLY_LIMITS,
  SEARCH_LISTS_ONLY_LIMITS,
} from '@/lib/search-client';
import type { UnifiedSearchItem } from '@/lib/unified-search';
import type { SearchQueryIntent } from '@/lib/search-keywords';

type TrendingQueryItem = { query: string; count: number };

type SearchListResult = SearchListRowData & {
  description?: string | null;
  categories?: { name: string; icon: string | null; slug?: string | null } | null;
};

type NavigableResult =
  | { kind: 'item'; item: UnifiedSearchItem }
  | { kind: 'list'; list: SearchListResult };

type TrendingListPreview = {
  listId: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  categorySlug?: string | null;
  saveCount: number;
  itemCount: number;
  description?: string | null;
  categories?: { name: string; icon?: string | null; slug?: string | null } | null;
};

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onApplyLocally?: (query: string) => void;
  localActionLabel?: string;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  initialQuery = '',
  onApplyLocally,
  localActionLabel,
}: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [directItems, setDirectItems] = useState<UnifiedSearchItem[]>([]);
  const [indirectItems, setIndirectItems] = useState<UnifiedSearchItem[]>([]);
  const [topPicks, setTopPicks] = useState<UnifiedSearchItem[]>([]);
  const [subThemes, setSubThemes] = useState<string[]>([]);
  const [queryIntent, setQueryIntent] = useState<SearchQueryIntent>('specific');
  const [directLists, setDirectLists] = useState<SearchListResult[]>([]);
  const [indirectLists, setIndirectLists] = useState<SearchListResult[]>([]);
  const [similarItems, setSimilarItems] = useState<UnifiedSearchItem[]>([]);
  const [totals, setTotals] = useState({ items: 0, lists: 0 });
  const [searchViewTab, setSearchViewTab] = useState<SearchResultTab>('items');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [trendingQueries, setTrendingQueries] = useState<TrendingQueryItem[]>([]);
  const [trendingSource, setTrendingSource] = useState<'analytics' | 'fallback'>('fallback');
  const [featuredLists, setFeaturedLists] = useState<TrendingListPreview[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestSeq = useRef(0);
  const listsRequestSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const listsAbortRef = useRef<AbortController | null>(null);
  const listsLoadedForRef = useRef('');
  const noResultsTracked = useRef('');

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialQuery);
    setActiveIndex(-1);
    setRecent(readRecentSearches());
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);

    setFeaturedLoading(true);
    void Promise.all([
      fetch('/api/search/trending?limit=6').then((res) => res.json()),
      fetch('/api/trending/global').then((res) => res.json()),
    ])
      .then(([trendingJson, listsJson]) => {
        if (trendingJson?.success && Array.isArray(trendingJson.data?.queries)) {
          setTrendingQueries(trendingJson.data.queries);
          setTrendingSource(trendingJson.data.source === 'analytics' ? 'analytics' : 'fallback');
        }
        if (listsJson?.success && Array.isArray(listsJson.data)) {
          setFeaturedLists(
            listsJson.data.slice(0, 6).map((row: TrendingListPreview & { categorySlug?: string | null }) => {
              const categorySlug = row.categorySlug ?? row.categories?.slug ?? null;
              const resolved = withResolvedListCover({
                slug: row.slug,
                title: row.title,
                coverImage: row.coverImage ?? null,
                categorySlug,
              });

              return {
                listId: row.listId,
                title: row.title,
                slug: row.slug,
                coverImage: resolved.coverImage,
                categorySlug,
                saveCount: row.saveCount ?? 0,
                itemCount: row.itemCount ?? 0,
                description: row.description ?? null,
                categories: categorySlug
                  ? {
                      slug: categorySlug,
                      name: row.categories?.name ?? '',
                      icon: row.categories?.icon ?? null,
                    }
                  : row.categories ?? null,
              };
            })
          );
        }
      })
      .catch(() => {
        setTrendingQueries([]);
        setFeaturedLists([]);
      })
      .finally(() => setFeaturedLoading(false));

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isOpen, initialQuery]);

  const fetchOverlayItems = useCallback(async (raw: string) => {
    const q = normalizeSearchQuery(raw);
    if (q.length < SEARCH_MIN_LENGTH) {
      setDirectItems([]);
      setIndirectItems([]);
      setTopPicks([]);
      setSubThemes([]);
      setQueryIntent('specific');
      setDirectLists([]);
      setIndirectLists([]);
      setSimilarItems([]);
      setTotals({ items: 0, lists: 0 });
      setSearchViewTab('items');
      setIsLoading(false);
      listsLoadedForRef.current = '';
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const seq = ++requestSeq.current;
    setIsLoading(true);
    listsLoadedForRef.current = '';

    try {
      const data = await fetchUnifiedSearch(
        { q, ...SEARCH_ITEMS_ONLY_LIMITS },
        { signal: controller.signal }
      );
      if (seq !== requestSeq.current || controller.signal.aborted) return;

      if (data) {
        setDirectItems(data.directItems);
        setIndirectItems(data.indirectItems);
        setTopPicks(data.topPicks ?? []);
        setSubThemes(data.subThemes ?? []);
        setQueryIntent(data.queryIntent ?? 'specific');
        setSimilarItems(data.relatedItems ?? data.similarItems ?? []);
        setDirectLists([]);
        setIndirectLists([]);
        setTotals((prev) => ({ items: data.totals.items, lists: prev.lists || 0 }));
      } else {
        setDirectItems([]);
        setIndirectItems([]);
        setTopPicks([]);
        setSubThemes([]);
        setDirectLists([]);
        setIndirectLists([]);
        setSimilarItems([]);
        setTotals({ items: 0, lists: 0 });
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (seq !== requestSeq.current) return;
      setDirectItems([]);
      setIndirectItems([]);
      setTopPicks([]);
      setSubThemes([]);
      setQueryIntent('specific');
      setDirectLists([]);
      setIndirectLists([]);
      setSimilarItems([]);
      setTotals({ items: 0, lists: 0 });
    } finally {
      if (seq === requestSeq.current && !controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchOverlayLists = useCallback(async (raw: string) => {
    const q = normalizeSearchQuery(raw);
    if (q.length < SEARCH_MIN_LENGTH) return;
    if (listsLoadedForRef.current === q) return;

    listsAbortRef.current?.abort();
    const controller = new AbortController();
    listsAbortRef.current = controller;
    const seq = ++listsRequestSeq.current;
    setIsLoadingLists(true);

    try {
      const data = await fetchUnifiedSearch(
        { q, ...SEARCH_LISTS_ONLY_LIMITS },
        { signal: controller.signal }
      );
      if (seq !== listsRequestSeq.current || controller.signal.aborted) return;
      if (!data) return;

      setDirectLists(data.directLists ?? data.lists);
      setIndirectLists(data.indirectLists ?? []);
      listsLoadedForRef.current = q;
      setTotals((prev) => ({ items: prev.items, lists: data.totals.lists }));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    } finally {
      if (seq === listsRequestSeq.current && !controller.signal.aborted) {
        setIsLoadingLists(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      listsAbortRef.current?.abort();
      return;
    }
    const timer = window.setTimeout(() => {
      void fetchOverlayItems(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, isOpen, fetchOverlayItems]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchViewTab('items');
    listsLoadedForRef.current = '';
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen || searchViewTab !== 'lists') return;
    void fetchOverlayLists(query);
  }, [isOpen, searchViewTab, query, fetchOverlayLists]);

  const isBroad = queryIntent === 'broad';
  const shownOverlayItems = isBroad
    ? directItems.length + topPicks.length + similarItems.length
    : directItems.length + indirectItems.length + similarItems.length;
  const shownOverlayLists = directLists.length + indirectLists.length;

  useEffect(() => {
    setActiveIndex(-1);
  }, [directItems, indirectItems, topPicks, directLists, indirectLists, searchViewTab]);

  const navigableResults = useMemo<NavigableResult[]>(() => {
    const rows: NavigableResult[] = [];
    const showItems = searchViewTab === 'items';
    const showLists = searchViewTab === 'lists';
    if (showItems) {
      if (isBroad) {
        for (const item of directItems) rows.push({ kind: 'item', item });
        for (const item of topPicks) rows.push({ kind: 'item', item });
      } else {
        for (const item of directItems) rows.push({ kind: 'item', item });
        for (const item of indirectItems) rows.push({ kind: 'item', item });
      }
    } else if (showLists) {
      for (const list of directLists) rows.push({ kind: 'list', list });
      for (const list of indirectLists) rows.push({ kind: 'list', list });
    }
    return rows;
  }, [directItems, indirectItems, topPicks, directLists, indirectLists, searchViewTab, isBroad]);

  const resultCount = totals.items + totals.lists;
  const hasAnyResults =
    directItems.length > 0 ||
    indirectItems.length > 0 ||
    topPicks.length > 0 ||
    directLists.length > 0 ||
    indirectLists.length > 0 ||
    similarItems.length > 0;

  useEffect(() => {
    if (activeIndex >= 0) {
      resultRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex]);

  const applyQuery = useCallback(
    (raw: string, source: string) => {
      const q = normalizeSearchQuery(raw);
      if (q.length < SEARCH_MIN_LENGTH) return;
      pushRecentSearch(q);
      trackSearch(q, source);

      if (onApplyLocally) {
        onApplyLocally(q);
        onClose();
        return;
      }

      onClose();
      router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [onApplyLocally, onClose, router]
  );

  const goToLists = useCallback(
    (raw: string) => applyQuery(raw, 'overlay_submit'),
    [applyQuery]
  );

  const fillQueryFromChip = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    });
  }, []);

  const navigateAndClose = (href: string) => {
    onClose();
    router.push(href);
  };

  const normalized = normalizeSearchQuery(query);
  const showResults = normalized.length >= SEARCH_MIN_LENGTH;
  const showItemResults = searchViewTab === 'items';
  const showListResults = searchViewTab === 'lists';
  const listNavOffset = showItemResults ? directItems.length + indirectItems.length : 0;

  useEffect(() => {
    if (!showResults || isLoading || hasAnyResults || normalized.length < SEARCH_MIN_LENGTH) {
      return;
    }
    if (noResultsTracked.current === normalized) return;
    noResultsTracked.current = normalized;
    trackSearchNoResults(normalized, 'overlay');
  }, [showResults, isLoading, hasAnyResults, normalized]);

  const analyticsQueries =
    trendingSource === 'analytics'
      ? trendingQueries.filter(
          (item) =>
            !SEARCH_SUGGESTIONS.some(
              (s) => s.query.toLowerCase() === item.query.toLowerCase()
            )
        )
      : [];

  const featuredPreview = featuredLists.slice(0, 3);

  const idleChips = useMemo(() => {
    const seen = new Set<string>();
    const chips: {
      key: string;
      label: string;
      query: string;
      variant: 'default' | 'primary';
      prefix?: 'recent' | 'hot';
    }[] = [];

    for (const item of recent) {
      const q = normalizeSearchQuery(item).toLowerCase();
      if (q.length < SEARCH_MIN_LENGTH || seen.has(q)) continue;
      seen.add(q);
      chips.push({
        key: `r-${q}`,
        label: suggestionLabelForQuery(item),
        query: item,
        variant: 'default',
        prefix: 'recent',
      });
    }

    for (const item of analyticsQueries.slice(0, 3)) {
      const q = item.query.toLowerCase();
      if (seen.has(q)) continue;
      seen.add(q);
      chips.push({
        key: `a-${q}`,
        label: item.query,
        query: item.query,
        variant: 'primary',
        prefix: 'hot',
      });
    }

    for (const chip of SEARCH_SUGGESTIONS) {
      const q = chip.query.toLowerCase();
      if (seen.has(q)) continue;
      seen.add(q);
      chips.push({
        key: chip.id,
        label: chip.label,
        query: chip.query,
        variant: 'default',
      });
      if (chips.length >= 8) break;
    }

    return chips;
  }, [recent, analyticsQueries]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (navigableResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % navigableResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? navigableResults.length - 1 : prev - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const row = navigableResults[activeIndex];
        if (!row) return;
        pushRecentSearch(normalized);
        if (row.kind === 'item') {
          trackSearchResultClick({
            query: normalized,
            source: 'overlay_keyboard',
            result_type: 'item',
            result_slug: row.item.id,
            category_slug: row.item.categorySlug ?? undefined,
            position: activeIndex + 1,
          });
          onClose();
          router.push(`/items/${row.item.id}`);
        } else {
          trackSearchResultClick({
            query: normalized,
            source: 'overlay_keyboard',
            result_type: 'list',
            result_slug: row.list.slug,
            category_slug: row.list.categories?.slug ?? undefined,
            position: activeIndex + 1,
          });
          onClose();
          router.push(`/lists/${row.list.slug}`);
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, navigableResults, activeIndex, router, normalized]);

  const allResultsLabel = onApplyLocally
    ? localActionLabel ?? 'اعمال فیلتر در این صفحه'
    : `مشاهده همه ${resultCount.toLocaleString('fa-IR')} نتیجه`;

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex animate-in fade-in justify-center bg-black/30 backdrop-blur-[2px] duration-200"
      dir="rtl"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`flex h-[100dvh] w-full max-w-none animate-in fade-in slide-in-from-top-2 flex-col bg-wibe-surface shadow-2xl duration-300 ${DESKTOP_PAGE_MAX_WIDTH_CLASS}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="جستجو"
      >
        <div className="flex-shrink-0 border-b border-wibe bg-wibe-surface/95 px-2.5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:scale-[0.98]"
            aria-label="بستن جستجو"
          >
            <ArrowRight className="h-5 w-5 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={query}
              onChange={setQuery}
              onSubmit={() => goToLists(query)}
              placeholder="فیلم، کتاب، کافه، لیست خاص…"
              autoFocus
              inputRef={inputRef}
            />
          </div>
        </div>
        {(showResults || isLoading) && (
          <p className="px-1 wibe-caption text-wibe-secondary">
            {isLoading
              ? 'در حال جستجو…'
              : `${resultCount.toLocaleString('fa-IR')} نتیجه${
                  navigableResults.length > 0 ? ' · ↑↓' : ''
                }`}
          </p>
        )}
      </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!showResults && (
          <div className="space-y-5">
            {idleChips.length > 0 && (
              <section>
                {recent.length > 0 && (
                  <div className="mb-1.5 flex justify-start">
                    <button
                      type="button"
                      onClick={() => {
                        clearRecentSearches();
                        setRecent([]);
                      }}
                      className="wibe-caption font-medium text-primary"
                    >
                      پاک کردن تاریخچه
                    </button>
                  </div>
                )}
                <SearchChipScroller>
                  {idleChips.map((chip) => (
                    <SearchChipButton
                      key={chip.key}
                      variant={chip.variant}
                      onClick={() => fillQueryFromChip(chip.query)}
                    >
                      {chip.prefix === 'hot' ? (
                        <span className="inline-flex items-center gap-1">
                          <span>🔥</span>
                          {chip.label}
                        </span>
                      ) : chip.prefix === 'recent' ? (
                        <span className="inline-flex items-center gap-1 text-wibe-secondary">
                          <span aria-hidden>🕐</span>
                          {chip.label}
                        </span>
                      ) : (
                        chip.label
                      )}
                    </SearchChipButton>
                  ))}
                </SearchChipScroller>
              </section>
            )}

            <section>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigateAndClose('/lists?mode=trending')}
                  className="flex items-center gap-0.5 wibe-caption font-medium text-primary"
                >
                  همه
                  <ChevronLeft className="h-3.5 w-3.5 rotate-180" aria-hidden />
                </button>
                <h3 className="flex items-center gap-1 wibe-caption font-medium text-wibe-secondary">
                  <Flame className="h-3.5 w-3.5 text-warning" aria-hidden />
                  ترند
                </h3>
              </div>

              {featuredLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-2.5 rounded-xl border border-wibe p-2">
                      <div className="h-16 w-16 animate-pulse rounded-lg bg-gray-200" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-200" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : featuredPreview.length > 0 ? (
                <div className="space-y-2">
                  {featuredPreview.map((list) => (
                    <SearchListRow
                      key={list.listId}
                      list={{
                        id: list.listId,
                        title: list.title,
                        slug: list.slug,
                        coverImage: list.coverImage,
                        categorySlug: list.categorySlug,
                        saveCount: list.saveCount,
                        itemCount: list.itemCount,
                        description: list.description,
                        categories: list.categories,
                      }}
                      onClick={onClose}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center wibe-caption text-wibe-secondary">
                  لیست ترندی نیست —{' '}
                  <button
                    type="button"
                    onClick={() => navigateAndClose('/lists')}
                    className="font-medium text-primary"
                  >
                    برو لیست‌ها
                  </button>
                </p>
              )}
            </section>

            <div className="border-t border-wibe pt-3 text-center">
              <button
                type="button"
                onClick={() => navigateAndClose('/user-lists')}
                className="wibe-caption font-medium text-wibe-secondary underline-offset-2 hover:text-primary hover:underline"
              >
                کشف در اکسپلور
              </button>
            </div>
          </div>
        )}

        {showResults && isLoading && !hasAnyResults && (
          <div className="space-y-2.5">
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

        {showResults && !isLoading && !hasAnyResults && !(searchViewTab === 'lists' && isLoadingLists) && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-7 w-7 text-wibe-secondary/70" strokeWidth={1.75} />
            </div>
            <p className="wibe-body font-medium text-foreground">نتیجه‌ای پیدا نشد</p>
            <p className="mt-1 wibe-caption text-wibe-secondary">
              عبارت دیگری امتحان کن یا از پیشنهادهای جستجو استفاده کن
            </p>
            <button
              type="button"
              onClick={() => goToLists(query)}
              className="mt-4 rounded-xl bg-primary px-4 py-2.5 wibe-small font-semibold text-white"
            >
              جستجو در همه نتایج
            </button>
          </div>
        )}

        {showResults && (hasAnyResults || (searchViewTab === 'lists' && isLoadingLists)) && (
          <div className="space-y-4">
            <SearchResultsSummary
              query={normalized}
              totals={totals}
              shownItems={shownOverlayItems}
              shownLists={shownOverlayLists}
              shownTopPicks={topPicks.length}
              queryIntent={queryIntent}
              activeTab={searchViewTab}
              onTabChange={setSearchViewTab}
            />

            {isBroad && subThemes.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {subThemes.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => fillQueryFromChip(theme)}
                    className="h-8 shrink-0 rounded-full border border-wibe bg-wibe-card px-3.5 wibe-caption font-medium text-foreground"
                  >
                    {theme}
                  </button>
                ))}
              </div>
            )}

            {showListResults && isLoadingLists && directLists.length + indirectLists.length === 0 && (
              <div className="space-y-2.5">
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

            {showListResults && (directLists.length > 0 || indirectLists.length > 0) && (
              <section>
                <h3 className="mb-2 px-0.5 wibe-caption font-medium text-wibe-secondary">
                  {isBroad ? 'لیست‌های پیشنهادی' : 'لیست‌ها'}
                  {totals.lists > directLists.length + indirectLists.length && (
                    <span className="mr-1 tabular-nums">
                      ({totals.lists.toLocaleString('fa-IR')})
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {directLists.map((list, index) => {
                    const navIndex = isBroad ? index : listNavOffset + index;
                    return (
                      <SearchListRow
                        key={list.id}
                        list={list as SearchListRowData}
                        highlightQuery={normalized}
                        isActive={activeIndex === navIndex}
                        innerRef={(el) => {
                          resultRefs.current[navIndex] = el;
                        }}
                        onClick={() => {
                          pushRecentSearch(normalized);
                          trackSearchResultClick({
                            query: normalized,
                            source: 'overlay_result',
                            result_type: 'list',
                            result_slug: list.slug,
                            category_slug: list.categories?.slug ?? undefined,
                            position: navIndex + 1,
                          });
                          onClose();
                        }}
                      />
                    );
                  })}
                  {indirectLists.map((list, index) => {
                    const navIndex = isBroad
                      ? directLists.length + index
                      : listNavOffset + directLists.length + index;
                    return (
                      <SearchListRow
                        key={list.id}
                        list={list as SearchListRowData}
                        highlightQuery={normalized}
                        isActive={activeIndex === navIndex}
                        innerRef={(el) => {
                          resultRefs.current[navIndex] = el;
                        }}
                        onClick={() => {
                          pushRecentSearch(normalized);
                          trackSearchResultClick({
                            query: normalized,
                            source: 'overlay_indirect',
                            result_type: 'list',
                            result_slug: list.slug,
                            category_slug: list.categories?.slug ?? undefined,
                            position: navIndex + 1,
                          });
                          onClose();
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {showItemResults && directItems.length > 0 && (
              <section>
                <div className="space-y-2">
                  {directItems.map((item, index) => {
                    const navIndex = isBroad
                      ? directLists.length + indirectLists.length + index
                      : index;
                    return (
                    <SearchItemRow
                      key={item.id}
                      item={item}
                      highlightQuery={normalized}
                      variant="direct"
                      isActive={activeIndex === navIndex}
                      innerRef={(el) => {
                        resultRefs.current[navIndex] = el;
                      }}
                      onClick={() => {
                        pushRecentSearch(normalized);
                        trackSearchResultClick({
                          query: normalized,
                          source: 'overlay_result',
                          result_type: 'item',
                          result_slug: item.id,
                          category_slug: item.categorySlug ?? undefined,
                          position: navIndex + 1,
                        });
                        onClose();
                      }}
                    />
                    );
                  })}
                </div>
              </section>
            )}

            {showItemResults && isBroad && topPicks.length > 0 && (
              <section>
                <h3 className="mb-2 px-0.5 wibe-caption font-medium text-wibe-secondary">
                  پیشنهادهای برتر
                </h3>
                <div className="space-y-2">
                  {topPicks.map((item, index) => {
                    const navIndex =
                      directLists.length + indirectLists.length + directItems.length + index;
                    return (
                      <SearchItemRow
                        key={item.id}
                        item={item}
                        highlightQuery={normalized}
                        variant="suggestion"
                        isActive={activeIndex === navIndex}
                        innerRef={(el) => {
                          resultRefs.current[navIndex] = el;
                        }}
                        onClick={() => {
                          pushRecentSearch(normalized);
                          trackSearchResultClick({
                            query: normalized,
                            source: 'overlay_result',
                            result_type: 'item',
                            result_slug: item.id,
                            category_slug: item.categorySlug ?? undefined,
                            position: navIndex + 1,
                          });
                          onClose();
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {showItemResults && !isBroad && indirectItems.length > 0 && (
              <section>
                <h3 className="mb-2 px-0.5 wibe-caption font-medium text-wibe-secondary">
                  مرتبط با جستجو
                </h3>
                <div className="space-y-2">
                  {indirectItems.map((item, index) => {
                    const navIndex = directItems.length + index;
                    return (
                      <SearchItemRow
                        key={item.id}
                        item={item}
                        highlightQuery={normalized}
                        isActive={activeIndex === navIndex}
                        innerRef={(el) => {
                          resultRefs.current[navIndex] = el;
                        }}
                        onClick={() => {
                          pushRecentSearch(normalized);
                          trackSearchResultClick({
                            query: normalized,
                            source: 'overlay_indirect',
                            result_type: 'item',
                            result_slug: item.id,
                            category_slug: item.categorySlug ?? undefined,
                            position: navIndex + 1,
                          });
                          onClose();
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {showListResults && !isBroad && (directLists.length > 0 || indirectLists.length > 0) && (
              <section>
                <h3 className="mb-2 px-0.5 wibe-caption font-medium text-wibe-secondary">
                  لیست‌ها
                  {totals.lists > directLists.length + indirectLists.length && (
                    <span className="mr-1 tabular-nums">
                      ({totals.lists.toLocaleString('fa-IR')})
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {directLists.map((list, index) => {
                    const navIndex = listNavOffset + index;
                    return (
                      <SearchListRow
                        key={list.id}
                        list={list as SearchListRowData}
                        highlightQuery={normalized}
                        isActive={activeIndex === navIndex}
                        innerRef={(el) => {
                          resultRefs.current[navIndex] = el;
                        }}
                        onClick={() => {
                          pushRecentSearch(normalized);
                          trackSearchResultClick({
                            query: normalized,
                            source: 'overlay_result',
                            result_type: 'list',
                            result_slug: list.slug,
                            category_slug: list.categories?.slug ?? undefined,
                            position: navIndex + 1,
                          });
                          onClose();
                        }}
                      />
                    );
                  })}
                  {indirectLists.map((list, index) => {
                    const navIndex = listNavOffset + directLists.length + index;
                    return (
                      <SearchListRow
                        key={list.id}
                        list={list as SearchListRowData}
                        highlightQuery={normalized}
                        isActive={activeIndex === navIndex}
                        innerRef={(el) => {
                          resultRefs.current[navIndex] = el;
                        }}
                        onClick={() => {
                          pushRecentSearch(normalized);
                          trackSearchResultClick({
                            query: normalized,
                            source: 'overlay_indirect',
                            result_type: 'list',
                            result_slug: list.slug,
                            category_slug: list.categories?.slug ?? undefined,
                            position: navIndex + 1,
                          });
                          onClose();
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {showItemResults && !isBroad && similarItems.length > 0 && (
              <section>
                <h3 className="mb-2 px-0.5 wibe-caption font-medium text-wibe-secondary">
                  پیشنهاد مرتبط
                </h3>
                <div className="space-y-2">
                  {similarItems.map((item) => (
                    <SearchItemRow
                      key={`sim-${item.id}`}
                      item={item}
                      compact
                      onClick={() => {
                        pushRecentSearch(normalized);
                        trackSearchResultClick({
                          query: normalized,
                          source: 'overlay_similar',
                          result_type: 'item',
                          result_slug: item.id,
                          category_slug: item.categorySlug ?? undefined,
                        });
                        onClose();
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {showItemResults &&
              totals.items > directItems.length + (isBroad ? topPicks.length : indirectItems.length) &&
              showItemResults && (
                <p className="text-center wibe-caption text-wibe-secondary">
                  {isBroad ? (
                    <>
                      +{(
                        totals.items - directItems.length - topPicks.length
                      ).toLocaleString('fa-IR')}{' '}
                      مورد دیگر — از لیست‌ها یا جستجوی دقیق‌تر کاوش کن
                    </>
                  ) : (
                    <>
                      {(totals.items - directItems.length - indirectItems.length).toLocaleString(
                        'fa-IR'
                      )}{' '}
                      آیتم دیگر — جستجو را دقیق‌تر کنید
                    </>
                  )}
                </p>
              )}

            {resultCount > navigableResults.length && (
              <button
                type="button"
                onClick={() => goToLists(query)}
                className="mt-2 w-full rounded-xl border border-primary/25 bg-primary/5 py-3 wibe-small font-semibold text-primary transition-transform active:scale-[0.99]"
              >
                {allResultsLabel}
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
}
