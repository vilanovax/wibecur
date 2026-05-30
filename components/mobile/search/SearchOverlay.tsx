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
import { trackSearch } from '@/lib/analytics';
import { withResolvedListCover } from '@/lib/resolve-list-cover';
import { MOBILE_SHELL_MAX_WIDTH_CLASS } from '@/components/providers/MainContainer';
import {
  SearchChipButton,
  SearchChipScroller,
  SearchListRow,
  type SearchListRowData,
} from '@/components/mobile/search/SearchOverlayParts';

type TrendingQueryItem = { query: string; count: number };

type SearchListResult = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage: string | null;
  saveCount?: number;
  itemCount?: number;
  categories?: { name: string; icon: string | null; slug?: string | null } | null;
};

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
  const [results, setResults] = useState<SearchListResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [trendingQueries, setTrendingQueries] = useState<TrendingQueryItem[]>([]);
  const [trendingSource, setTrendingSource] = useState<'analytics' | 'fallback'>('fallback');
  const [featuredLists, setFeaturedLists] = useState<TrendingListPreview[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestSeq = useRef(0);

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

  const runSearch = useCallback(async (raw: string) => {
    const q = normalizeSearchQuery(raw);
    if (q.length < SEARCH_MIN_LENGTH) {
      setResults([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    const seq = ++requestSeq.current;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/lists/search?q=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json();
      if (seq !== requestSeq.current) return;

      if (json.success) {
        setResults(json.data.lists ?? []);
        setTotal(json.data.total ?? 0);
      } else {
        setResults([]);
        setTotal(0);
      }
    } catch {
      if (seq !== requestSeq.current) return;
      setResults([]);
      setTotal(0);
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, isOpen, runSearch]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

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
      router.push(`/lists?q=${encodeURIComponent(q)}`);
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

      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const list = results[activeIndex];
        if (list) {
          pushRecentSearch(normalized);
          trackSearch(normalized, 'overlay_keyboard');
          onClose();
          router.push(`/lists/${list.slug}`);
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, results, activeIndex, router, normalized]);

  const allResultsLabel = onApplyLocally
    ? localActionLabel ?? 'اعمال فیلتر در این صفحه'
    : `مشاهده همه ${total.toLocaleString('fa-IR')} نتیجه در لیست‌ها`;

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex animate-in fade-in justify-center bg-black/30 backdrop-blur-[2px] duration-200"
      dir="rtl"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`flex h-[100dvh] w-full animate-in fade-in slide-in-from-top-2 flex-col bg-wibe-surface shadow-2xl duration-300 ${MOBILE_SHELL_MAX_WIDTH_CLASS}`}
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
              : `${total.toLocaleString('fa-IR')} نتیجه${results.length > 0 ? ' · ↑↓' : ''}`}
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

        {showResults && isLoading && results.length === 0 && (
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

        {showResults && !isLoading && results.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-7 w-7 text-wibe-secondary/70" strokeWidth={1.75} />
            </div>
            <p className="wibe-body font-medium text-foreground">لیستی پیدا نشد</p>
            <p className="mt-1 wibe-caption text-wibe-secondary">
              عبارت دیگری امتحان کن یا در همه لیست‌ها بگرد
            </p>
            <button
              type="button"
              onClick={() => goToLists(query)}
              className="mt-4 rounded-xl bg-primary px-4 py-2.5 wibe-small font-semibold text-white"
            >
              جستجو در همه لیست‌ها
            </button>
          </div>
        )}

        {showResults && results.length > 0 && (
          <div className="space-y-2">
            {results.map((list, index) => (
              <SearchListRow
                key={list.id}
                list={list as SearchListRowData}
                highlightQuery={normalized}
                isActive={activeIndex === index}
                innerRef={(el) => {
                  resultRefs.current[index] = el;
                }}
                onClick={() => {
                  pushRecentSearch(normalized);
                  trackSearch(normalized, 'overlay_result');
                  onClose();
                }}
              />
            ))}

            {total > results.length && (
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
