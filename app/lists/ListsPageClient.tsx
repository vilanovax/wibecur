'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutGrid, List, Filter, Bookmark } from 'lucide-react';
import type { ListsBrowseList } from '@/lib/lists-browse-shared';
import ListCardCompact from '@/components/mobile/lists/ListCardCompact';
import ListsFeaturedCarousel from '@/components/mobile/lists/ListsFeaturedCarousel';
import ListsCategorySection from '@/components/mobile/lists/ListsCategorySection';
import InfiniteScrollSentinel from '@/components/mobile/lists/InfiniteScrollSentinel';
import ListsSimilarRow from '@/components/mobile/lists/ListsSimilarRow';
import SearchInput from '@/components/mobile/search/SearchInput';
import SearchResultSkeleton from '@/components/mobile/search/SearchResultSkeleton';
import { filterListsByQuery, normalizeSearchQuery, pushRecentSearch, SEARCH_MIN_LENGTH } from '@/lib/list-search';
import { useUnifiedSearchQuery } from '@/lib/hooks/useUnifiedSearchQuery';
import { trackSearch, trackSearchNoResults } from '@/lib/analytics';
import { useSearch } from '@/contexts/SearchContext';
import { pickSimilarLists } from '@/lib/lists-page-similar';
import FilterBottomSheetPro, {
  type FilterState,
  type VibeFilter,
} from '@/components/mobile/lists/lists-lazy-sections';
import {
  SearchResultsPanelLazy,
  ListsCategorySectionLazy,
} from '@/components/mobile/lists/lists-lazy-sections';
import HomeDeferredMount from '@/components/mobile/home/HomeDeferredMount';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import {
  LISTS_VIEW_MODE_DESKTOP_KEY,
  LISTS_VIEW_MODE_MOBILE_KEY,
  listsResultsGridClass,
  readStoredListsViewMode,
  resolveListCardVariant,
  type ListsViewMode,
} from '@/lib/lists-page-layout';
import { LISTS_BROWSE_DEFAULT_LIMIT } from '@/lib/lists-browse-shared';

type ListWithCategory = ListsBrowseList;

type ListsPageCategory = {
  id: string;
  name: string;
  slug: string | null;
  icon: string | null;
  color: string | null;
  order: number | null;
  isActive: boolean;
};

interface ListsPageClientProps {
  lists: ListWithCategory[];
  totalListCount: number;
  categories: ListsPageCategory[];
  initialCategory?: string;
  initialSearch?: string;
  initialMode?: string;
}

type SortOption = 'newest' | 'popular' | 'most_saved' | 'rising';
type ViewMode = ListsViewMode;
type BrowseMode = 'trending' | 'newest' | 'popular' | 'saved';

const VIBE_CHIPS: { value: VibeFilter; label: string }[] = [
  { value: 'trending', label: '🔥 ترند' },
  { value: 'saved', label: '⭐ محبوب' },
  { value: 'sleep', label: '🌙 قبل خواب' },
  { value: 'calm_movie', label: '🎬 فیلم آرامش‌بخش' },
  { value: 'cafe', label: '☕ کافه دنج' },
  { value: 'family', label: '👨‍👩‍👧 خانوادگی' },
  { value: 'comedy', label: '🎭 کمدی' },
  { value: 'drama', label: '🎭 درام' },
];

const BROWSE_MODES: { value: BrowseMode; label: string }[] = [
  { value: 'trending', label: 'ترند' },
  { value: 'newest', label: 'جدید' },
  { value: 'popular', label: 'محبوب' },
  { value: 'saved', label: 'ذخیره‌شده' },
];

function matchVibe(
  list: ListWithCategory,
  vibe: VibeFilter,
  bookmarkedIds: Set<string>,
  trendingIdSet: Set<string>
): boolean {
  const title = (list.title || '').toLowerCase();
  const desc = (list.description || '').toLowerCase();
  const text = `${title} ${desc}`;
  switch (vibe) {
    case 'trending':
      if (trendingIdSet.size > 0) return trendingIdSet.has(list.id);
      return (
        list.badge === 'TRENDING' ||
        list.badge?.toString().toLowerCase() === 'trending' ||
        (list.saveCount ?? 0) >= 15
      );
    case 'saved':
      return bookmarkedIds.has(list.id);
    case 'sleep':
      return /خواب|آرامش/.test(text);
    case 'calm_movie':
      return /فیلم/.test(text) && /آرامش|دنج/.test(text);
    case 'cafe':
      return /کافه|قهوه/.test(text);
    case 'family':
      return /خانوادگ|خانواده/.test(text);
    case 'comedy':
      return /کمدی/.test(text);
    case 'drama':
      return /درام|درام/.test(text);
    default:
      return true;
  }
}

function matchCreatorType(list: ListWithCategory, creatorType: FilterState['creatorType']): boolean {
  if (creatorType === 'all') return true;
  const saveCount = list.saveCount ?? 0;
  const createdDaysAgo = list.createdAt
    ? (Date.now() - new Date(list.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    : 999;
  switch (creatorType) {
    case 'top':
      return list.isFeatured === true || saveCount >= 50;
    case 'new':
      return createdDaysAgo <= 30;
    case 'viral':
      return list.badge === 'TRENDING' || saveCount >= 100;
    default:
      return true;
  }
}

function matchMinRating(list: ListWithCategory, minRating: number): boolean {
  if (minRating <= 0) return true;
  const saveCount = list.saveCount ?? 0;
  const thresholds = [0, 5, 10, 20, 50];
  return saveCount >= (thresholds[minRating - 1] ?? 0);
}

function browseModeToFilter(mode: BrowseMode): Pick<FilterState, 'sortBy' | 'vibes'> {
  switch (mode) {
    case 'trending':
      return { sortBy: 'rising', vibes: new Set<VibeFilter>(['trending']) };
    case 'newest':
      return { sortBy: 'newest', vibes: new Set() };
    case 'popular':
      return { sortBy: 'most_saved', vibes: new Set() };
    case 'saved':
      return { sortBy: 'most_saved', vibes: new Set<VibeFilter>(['saved']) };
  }
}

function inferBrowseMode(state: FilterState): BrowseMode {
  if (state.vibes.has('saved')) return 'saved';
  if (state.vibes.has('trending')) return 'trending';
  if (state.sortBy === 'newest' && state.vibes.size === 0) return 'newest';
  if (state.sortBy === 'most_saved' || state.sortBy === 'popular') return 'popular';
  return 'trending';
}

/** پیش‌فرض کاتالوگ: ترند — محور اصلی browse mode است، نه وایب‌چیپ‌ها */
const DEFAULT_FILTER: FilterState = {
  categories: new Set(),
  sortBy: 'rising',
  vibes: new Set<VibeFilter>(['trending']),
  creatorType: 'all',
  minItemCount: 0,
  minRating: 0,
};

const VIEW_MODE_KEY = 'listsPage_viewMode'; // legacy — migrated on read
const PAGE_SIZE = 24;
/** پیش‌نمایش هر دسته در نمای سکشن‌بندی‌شده */
const SECTION_PREVIEW_MOBILE = 4;
const SECTION_PREVIEW_DESKTOP = 8;
const STICKY_OFFSET = 154;

function resolveCategoryIdFromParam(
  param: string | undefined,
  categoryList: ListsPageCategory[]
): string | null {
  if (!param) return null;
  const byId = categoryList.find((c) => c.id === param);
  if (byId) return byId.id;
  const bySlug = categoryList.find((c) => c.slug === param);
  return bySlug?.id ?? null;
}

/** فقط نوار افقی چیپ‌ها را اسکرول می‌کند — بدون جابجایی صفحه */
function scrollChipIntoHorizontalView(container: HTMLElement, chip: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const chipRect = chip.getBoundingClientRect();
  const chipCenter = chipRect.left + chipRect.width / 2;
  const containerCenter = containerRect.left + containerRect.width / 2;
  container.scrollBy({ left: chipCenter - containerCenter, behavior: 'smooth' });
}

export default function ListsPageClient({
  lists: initialLists,
  totalListCount,
  categories,
  initialCategory,
  initialSearch,
  initialMode,
}: ListsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { openSearch } = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialModeApplied = useRef(false);

  const categoryById = categories.find((c) => c.id === initialCategory);
  const categoryBySlug = categories.find((c) => 'slug' in c && (c as { slug: string }).slug === initialCategory);
  const resolvedCategoryId =
    resolveCategoryIdFromParam(initialCategory, categories) ??
    categoryById?.id ??
    categoryBySlug?.id ??
    null;

  const [filterState, setFilterState] = useState<FilterState>(() => ({
    ...DEFAULT_FILTER,
    categories: resolvedCategoryId ? new Set([resolvedCategoryId]) : new Set(),
  }));
  const [searchQuery, setSearchQuery] = useState(initialSearch ?? '');
  const search = useUnifiedSearchQuery(searchQuery);
  const lastNoResultsQuery = useRef('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  const [highlightCategoryId, setHighlightCategoryId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [trendingListIds, setTrendingListIds] = useState<string[]>([]);
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const [allLists, setAllLists] = useState(initialLists);
  const [hasMoreRemote, setHasMoreRemote] = useState(totalListCount > initialLists.length);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const remoteFetchLock = useRef(false);
  const categoryChipsRef = useRef<HTMLDivElement>(null);
  const isScrollingToCategory = useRef(false);
  const viewModeHydrated = useRef(false);
  const isDesktop = useIsDesktop();
  const sectionPreviewCount = isDesktop ? SECTION_PREVIEW_DESKTOP : SECTION_PREVIEW_MOBILE;

  const publicLists = allLists.filter((l) => l.isActive && l.isPublic);
  const activeCategories = categories.filter((c) => c.isActive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const browseMode = inferBrowseMode(filterState);
  const trendingIdSet = useMemo(() => new Set(trendingListIds), [trendingListIds]);

  const applyFilter = useMemo(() => {
    return (listItems: ListWithCategory[], state: FilterState) => {
      return listItems.filter((list) => {
        const categoryMatch =
          state.categories.size === 0 ||
          (list.categoryId != null && state.categories.has(list.categoryId));
        const vibeMatch =
          state.vibes.size === 0 ||
          [...state.vibes].some((v) => matchVibe(list, v, bookmarkedIds, trendingIdSet));
        const creatorMatch = matchCreatorType(list, state.creatorType);
        const itemCountMatch = (list.itemCount ?? 0) >= state.minItemCount;
        const ratingMatch = matchMinRating(list, state.minRating);
        return categoryMatch && vibeMatch && creatorMatch && itemCountMatch && ratingMatch;
      });
    };
  }, [bookmarkedIds, trendingIdSet]);

  const normalizedSearch = search.normalized;
  const isSearchActive = search.isActive;
  const searchLoading = search.loading;
  const hasSearchResults = search.hasResults;

  const searchFilteredLists = useMemo(() => {
    if (!isSearchActive) return [];
    return filterListsByQuery(publicLists, searchQuery);
  }, [isSearchActive, publicLists, searchQuery]);

  const searchFiltered = useMemo(() => {
    const q = normalizeSearchQuery(searchQuery);
    if (!q) return publicLists;
    if (isSearchActive) return searchFilteredLists;
    return filterListsByQuery(publicLists, searchQuery);
  }, [publicLists, searchQuery, isSearchActive, searchFilteredLists]);

  const getResultCount = (state: FilterState) => {
    return applyFilter(searchFiltered, state).length;
  };

  useEffect(() => {
    const legacy = localStorage.getItem(VIEW_MODE_KEY);
    if (legacy === 'grid' || legacy === 'compact') {
      localStorage.setItem(LISTS_VIEW_MODE_MOBILE_KEY, legacy);
      localStorage.setItem(LISTS_VIEW_MODE_DESKTOP_KEY, legacy);
      localStorage.removeItem(VIEW_MODE_KEY);
    }
    setViewMode(readStoredListsViewMode(isDesktop));
    viewModeHydrated.current = true;
  }, [isDesktop]);

  useEffect(() => {
    if (!viewModeHydrated.current) return;
    const key = isDesktop ? LISTS_VIEW_MODE_DESKTOP_KEY : LISTS_VIEW_MODE_MOBILE_KEY;
    localStorage.setItem(key, viewMode);
  }, [viewMode, isDesktop]);

  useEffect(() => {
    const saved = localStorage.getItem('listsPage_filterState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<FilterState> & {
          categories?: string[];
          vibes?: VibeFilter[];
        };
        if (parsed) {
          setFilterState((prev) => ({
            ...prev,
            sortBy: parsed.sortBy ?? prev.sortBy,
            vibes: Array.isArray(parsed.vibes) ? new Set(parsed.vibes) : prev.vibes,
            creatorType: parsed.creatorType ?? prev.creatorType,
            minItemCount: typeof parsed.minItemCount === 'number'
              ? parsed.minItemCount === 5
                ? 0
                : parsed.minItemCount
              : prev.minItemCount,
            minRating: typeof parsed.minRating === 'number' ? parsed.minRating : prev.minRating,
          }));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  /** پارامتر category در URL منبع اصلی فیلتر دسته است — localStorage نباید آن را بازنویسی کند */
  useEffect(() => {
    const categoryId = resolveCategoryIdFromParam(initialCategory, categories);
    setFilterState((prev) => ({
      ...prev,
      categories: categoryId ? new Set([categoryId]) : new Set(),
    }));
    setHighlightCategoryId(null);
  }, [initialCategory, categories]);

  useEffect(() => {
    if (initialModeApplied.current) return;
    const mode = initialMode as BrowseMode | undefined;
    if (mode && ['trending', 'newest', 'popular', 'saved'].includes(mode)) {
      const { sortBy, vibes } = browseModeToFilter(mode);
      setFilterState((s) => ({
        ...s,
        sortBy,
        vibes,
        categories: resolvedCategoryId ? new Set([resolvedCategoryId]) : s.categories,
      }));
      initialModeApplied.current = true;
    }
  }, [initialMode]);

  useEffect(() => {
    localStorage.setItem(
      'listsPage_filterState',
      JSON.stringify({
        sortBy: filterState.sortBy,
        vibes: [...filterState.vibes],
        creatorType: filterState.creatorType,
        minItemCount: filterState.minItemCount,
        minRating: filterState.minRating,
      })
    );
  }, [filterState]);

  useEffect(() => {
    const needsTrending =
      browseMode === 'trending' || [...filterState.vibes].includes('trending');
    if (!needsTrending || trendingLoaded) return;

    fetch('/api/trending/global')
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setTrendingListIds(
            json.data
              .map((row: { listId?: string }) => row.listId)
              .filter((id: string | undefined): id is string => Boolean(id))
          );
        }
      })
      .catch(() => {})
      .finally(() => setTrendingLoaded(true));
  }, [browseMode, filterState.vibes, trendingLoaded]);

  useEffect(() => {
    const needsBookmarks =
      browseMode === 'saved' || [...filterState.vibes].includes('saved');
    if (!needsBookmarks || bookmarksLoaded) return;

    fetch('/api/user/bookmarks?limit=500')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data?.bookmarks)) {
          const ids = new Set<string>(
            data.data.bookmarks
              .map((b: { list?: { id: string } }) => b.list?.id)
              .filter((id: string | undefined): id is string => Boolean(id))
          );
          setBookmarkedIds(ids);
        }
      })
      .catch(() => {})
      .finally(() => setBookmarksLoaded(true));
  }, [browseMode, filterState.vibes, bookmarksLoaded]);

  useEffect(() => {
    if (initialSearch) {
      const timer = window.setTimeout(() => searchInputRef.current?.focus(), 200);
      return () => window.clearTimeout(timer);
    }
  }, [initialSearch]);

  useEffect(() => {
    const q = normalizeSearchQuery(searchQuery);
    const params = new URLSearchParams(window.location.search);

    if (q) params.set('q', q);
    else params.delete('q');

    if (browseMode !== 'trending') params.set('mode', browseMode);
    else params.delete('mode');

    if (filterState.categories.size === 1) {
      const catId = [...filterState.categories][0];
      const cat = activeCategories.find((c) => c.id === catId);
      if (cat?.slug) params.set('category', cat.slug);
      else params.set('category', catId);
    } else {
      params.delete('category');
    }

    const next = params.toString();
    const current = window.location.search.replace(/^\?/, '');
    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [searchQuery, browseMode, filterState.categories, activeCategories, router, pathname]);

  const filteredLists = isSearchActive
    ? searchFiltered
    : applyFilter(searchFiltered, filterState);

  const sortedLists = useMemo(() => {
    if (isSearchActive) return filteredLists;

    const result = [...filteredLists].sort((a, b) => {
      switch (filterState.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular':
          return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        case 'most_saved':
          return (b.saveCount ?? 0) - (a.saveCount ?? 0);
        case 'rising':
          return (b.saveCount ?? 0) - (a.saveCount ?? 0);
        default:
          return 0;
      }
    });

    if (browseMode === 'trending' && trendingListIds.length > 0) {
      const order = new Map(trendingListIds.map((id, index) => [id, index]));
      result.sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999));
    }

    return result;
  }, [filteredLists, filterState.sortBy, browseMode, trendingListIds, isSearchActive]);

  useEffect(() => {
    if (!isSearchActive) {
      lastNoResultsQuery.current = '';
      return;
    }
    if (searchLoading || publicLists.length === 0) return;
    if (hasSearchResults) {
      lastNoResultsQuery.current = '';
      return;
    }
    if (lastNoResultsQuery.current === normalizedSearch) return;
    lastNoResultsQuery.current = normalizedSearch;
    trackSearchNoResults(normalizedSearch, 'lists_page');
  }, [isSearchActive, normalizedSearch, searchLoading, hasSearchResults, publicLists.length]);

  const setBrowseMode = (mode: BrowseMode) => {
    const { sortBy, vibes } = browseModeToFilter(mode);
    setFilterState((s) => ({
      ...s,
      sortBy,
      vibes,
    }));
    setHighlightCategoryId(null);
  };

  const handleBookmarkToggle = useCallback((listId: string, isBookmarked: boolean) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.add(listId);
      else next.delete(listId);
      return next;
    });
  }, []);

  const scrollToCategory = useCallback((categoryId: string) => {
    isScrollingToCategory.current = true;
    setHighlightCategoryId(categoryId);
    requestAnimationFrame(() => {
      const el = document.getElementById(`lists-category-${categoryId}`);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
      window.setTimeout(() => {
        isScrollingToCategory.current = false;
      }, 700);
    });
  }, []);

  const hasAdvancedFilters =
    [...filterState.vibes].some((v) => v !== 'trending' && v !== 'saved') ||
    filterState.creatorType !== 'all' ||
    filterState.minItemCount > 0 ||
    filterState.minRating > 0;

  const singleCategoryFilter = filterState.categories.size === 1;

  const useSectionLayout =
    !searchQuery.trim() &&
    !hasAdvancedFilters &&
    browseMode !== 'saved' &&
    !singleCategoryFilter &&
    (browseMode === 'newest' || browseMode === 'popular' || browseMode === 'trending');

  useEffect(() => {
    if (!useSectionLayout) setHighlightCategoryId(null);
  }, [useSectionLayout]);

  useEffect(() => {
    setAllLists(initialLists);
    setHasMoreRemote(totalListCount > initialLists.length);
  }, [initialLists, totalListCount]);

  const serverBrowseCategoryId =
    filterState.categories.size === 1 ? [...filterState.categories][0] : null;

  const fetchMoreRemoteLists = useCallback(async () => {
    if (remoteFetchLock.current || !hasMoreRemote || isLoadingRemote) return;
    remoteFetchLock.current = true;
    setIsLoadingRemote(true);

    try {
      const params = new URLSearchParams({
        offset: String(allLists.length),
        limit: String(LISTS_BROWSE_DEFAULT_LIMIT),
        sort: filterState.sortBy,
      });
      if (serverBrowseCategoryId) {
        params.set('categoryId', serverBrowseCategoryId);
      }

      const res = await fetch(`/api/lists/browse?${params.toString()}`);
      const data = await res.json();
      if (!data?.success || !Array.isArray(data.lists)) return;

      setAllLists((prev) => {
        const seen = new Set(prev.map((l) => l.id));
        const next = data.lists.filter(
          (list: ListWithCategory) => !seen.has(list.id)
        );
        return next.length > 0 ? [...prev, ...next] : prev;
      });
      setHasMoreRemote(Boolean(data.pagination?.hasMore));
    } catch {
      // keep current state
    } finally {
      setIsLoadingRemote(false);
      remoteFetchLock.current = false;
    }
  }, [
    allLists.length,
    filterState.sortBy,
    hasMoreRemote,
    isLoadingRemote,
    serverBrowseCategoryId,
  ]);

  useEffect(() => {
    remoteFetchLock.current = false;
  }, [filterState.sortBy, serverBrowseCategoryId, browseMode]);

  useEffect(() => {
    const isDefaultBrowse =
      filterState.sortBy === 'newest' &&
      !serverBrowseCategoryId &&
      browseMode !== 'trending' &&
      browseMode !== 'saved';

    if (isDefaultBrowse) {
      setAllLists(initialLists);
      setHasMoreRemote(totalListCount > initialLists.length);
      return;
    }

    let cancelled = false;
    remoteFetchLock.current = true;
    setIsLoadingRemote(true);

    const params = new URLSearchParams({
      offset: '0',
      limit: '120',
      sort: filterState.sortBy,
    });
    if (serverBrowseCategoryId) {
      params.set('categoryId', serverBrowseCategoryId);
    }

    fetch(`/api/lists/browse?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.success || !Array.isArray(data.lists)) return;
        setAllLists(data.lists);
        setHasMoreRemote(Boolean(data.pagination?.hasMore));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRemote(false);
          remoteFetchLock.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    filterState.sortBy,
    serverBrowseCategoryId,
    browseMode,
    initialLists,
    totalListCount,
  ]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterState, searchQuery, browseMode, viewMode]);

  const canRemotePaginate =
    !isSearchActive &&
    browseMode !== 'saved' &&
    !hasAdvancedFilters;

  const featuredLists = useMemo(() => {
    if (!useSectionLayout || sortedLists.length === 0) return [];
    const featured = sortedLists.filter((l) => l.isFeatured);
    const picks: ListWithCategory[] = [];
    for (const list of featured) {
      if (picks.length >= 3) break;
      picks.push(list);
    }
    if (picks.length < 2) {
      for (const list of sortedLists) {
        if (picks.some((p) => p.id === list.id)) continue;
        if (picks.length >= 3) break;
        if ((list.saveCount ?? 0) >= 5 || picks.length === 0) picks.push(list);
      }
    }
    return picks.slice(0, 3);
  }, [useSectionLayout, sortedLists]);

  const featuredIds = useMemo(() => new Set(featuredLists.map((l) => l.id)), [featuredLists]);

  const listsForSections = useMemo(() => {
    return sortedLists.filter((l) => !featuredIds.has(l.id));
  }, [sortedLists, featuredIds]);

  const categorySections = useMemo(() => {
    if (!useSectionLayout) return [];
    return activeCategories
      .map((cat) => ({
        category: cat,
        lists: listsForSections.filter((l) => l.categoryId === cat.id),
      }))
      .filter((s) => s.lists.length > 0);
  }, [useSectionLayout, activeCategories, listsForSections]);

  const pageSimilarLists = useMemo(() => {
    if (!useSectionLayout || sortedLists.length < 4) return [];
    const anchor = featuredLists[0] ?? sortedLists[0];
    if (!anchor) return [];
    const excludeIds = new Set<string>([
      ...featuredLists.map((l) => l.id),
      ...categorySections.flatMap((s) =>
        s.lists.slice(0, sectionPreviewCount).map((l) => l.id)
      ),
    ]);
    return pickSimilarLists(anchor, sortedLists, excludeIds, 4);
  }, [useSectionLayout, sortedLists, featuredLists, categorySections, sectionPreviewCount]);

  useEffect(() => {
    if (!useSectionLayout || categorySections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingToCategory.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id?.startsWith('lists-category-')) {
          setHighlightCategoryId(visible.target.id.replace('lists-category-', ''));
        }
      },
      { rootMargin: `-${STICKY_OFFSET}px 0px -55% 0px`, threshold: [0.15, 0.4, 0.7] }
    );

    categorySections.forEach(({ category }) => {
      const el = document.getElementById(`lists-category-${category.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [useSectionLayout, categorySections]);

  useEffect(() => {
    if (!useSectionLayout) return;

    const onScroll = () => {
      if (window.scrollY < 180) {
        setHighlightCategoryId(null);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [useSectionLayout]);

  const visibleFlatLists = sortedLists.slice(0, visibleCount);
  const hasMoreFlat =
    !useSectionLayout &&
    (visibleCount < sortedLists.length || (canRemotePaginate && hasMoreRemote));

  const loadMoreFlat = useCallback(async () => {
    if (visibleCount < sortedLists.length) {
      setVisibleCount((n) => Math.min(n + PAGE_SIZE, sortedLists.length));
      return;
    }
    if (!canRemotePaginate || !hasMoreRemote || isLoadingRemote) return;
    await fetchMoreRemoteLists();
    setVisibleCount((n) => n + PAGE_SIZE);
  }, [
    visibleCount,
    sortedLists.length,
    canRemotePaginate,
    hasMoreRemote,
    isLoadingRemote,
    fetchMoreRemoteLists,
  ]);

  const flatSimilarLists = useMemo(() => {
    if (useSectionLayout || sortedLists.length < 5) return [];
    const visible = sortedLists.slice(0, visibleCount);
    if (visible.length === 0) return [];
    const anchor = visible[0];
    const excludeIds = new Set(visible.map((l) => l.id));
    return pickSimilarLists(anchor, sortedLists, excludeIds, 4);
  }, [useSectionLayout, sortedLists, visibleCount]);

  const selectedCategory =
    useSectionLayout && highlightCategoryId
      ? activeCategories.find((c) => c.id === highlightCategoryId)
      : filterState.categories.size === 1
        ? activeCategories.find((c) => filterState.categories.has(c.id))
        : null;

  const breadcrumbCategory =
    selectedCategory ?? categories.find((c) => c.slug === initialCategory) ?? null;

  const breadcrumbItems = useMemo(
    () => [
      { label: 'خانه', href: '/' },
      { label: 'لیست‌ها', href: '/lists' },
      ...(breadcrumbCategory ? [{ label: breadcrumbCategory.name }] : []),
    ],
    [breadcrumbCategory]
  );

  const showBrowseToolbar = !isSearchActive && !singleCategoryFilter;
  const displayViewMode: ViewMode = singleCategoryFilter ? 'grid' : viewMode;

  const isAllCategoriesSelected = useSectionLayout
    ? highlightCategoryId === null && filterState.categories.size === 0
    : filterState.categories.size === 0;

  const isCategorySelected = (catId: string) =>
    useSectionLayout
      ? highlightCategoryId === catId
      : filterState.categories.has(catId);

  const handleAllCategoriesClick = () => {
    if (useSectionLayout) {
      setHighlightCategoryId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setFilterState((s) => ({ ...s, categories: new Set() }));
    const params = new URLSearchParams(window.location.search);
    params.delete('category');
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    });
  };

  const handleShowAllCategory = useCallback(
    (categoryId: string, categorySlug?: string) => {
      setFilterState((s) => ({ ...s, categories: new Set([categoryId]) }));
      setHighlightCategoryId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const params = new URLSearchParams(window.location.search);
      if (categorySlug) params.set('category', categorySlug);
      else params.set('category', categoryId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname]
  );

  const handleCategoryClick = (catId: string) => {
    if (useSectionLayout) {
      scrollToCategory(catId);
      requestAnimationFrame(() => {
        const container = categoryChipsRef.current;
        const chip = container?.querySelector<HTMLElement>(`[data-category-chip="${catId}"]`);
        if (container && chip) scrollChipIntoHorizontalView(container, chip);
      });
      return;
    }
    setFilterState((s) => ({ ...s, categories: new Set([catId]) }));
    const cat = activeCategories.find((c) => c.id === catId);
    const params = new URLSearchParams(window.location.search);
    if (cat?.slug) params.set('category', cat.slug);
    else params.set('category', catId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const contextParts = [
    `${sortedLists.length.toLocaleString('fa-IR')} لیست`,
    BROWSE_MODES.find((m) => m.value === browseMode)?.label ?? '',
    selectedCategory
      ? selectedCategory.name
      : filterState.categories.size > 1
        ? `${filterState.categories.size.toLocaleString('fa-IR')} دسته`
        : 'همه دسته‌ها',
  ];

  const savedBrowseEmpty = browseMode === 'saved' && bookmarksLoaded && sortedLists.length === 0;
  const trendingBrowseEmpty =
    browseMode === 'trending' && trendingLoaded && sortedLists.length === 0 && publicLists.length > 0;

  const showContextBar = !isSearchActive && isDesktop && !useSectionLayout;

  return (
    <div className="w-full min-w-0 space-y-0 pb-6 lg:pb-4">
      <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
      <div className="mb-2 max-lg:px-4 lg:mb-3">
        <PageBreadcrumb items={breadcrumbItems} />
      </div>
      <h1 className="mb-2 hidden wibe-h3 font-bold text-foreground lg:block">لیست‌ها</h1>
      {/* جستجو در همین صفحه — هدر دسکتاپ جستجو ندارد تا تکراری نشود */}
      <div className="pb-2 pt-1 max-lg:px-4 lg:pb-2 lg:pt-0 lg:px-0">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={() => {
                  const q = normalizeSearchQuery(searchQuery);
                  if (q) {
                    pushRecentSearch(q);
                    trackSearch(q, 'lists_input');
                  }
                }}
                placeholder="جستجو در لیست‌ها و آیتم‌ها…"
                inputRef={searchInputRef}
              />
            </div>
            <button
              type="button"
              onClick={() => openSearch({ query: searchQuery })}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-wibe bg-wibe-card text-wibe-secondary transition-colors hover:border-primary/30 hover:text-primary active:scale-[0.98] lg:h-9 lg:w-9 ${
                isSearchActive ? 'hidden' : ''
              }`}
              aria-label="جستجوی سراسری"
              title="جستجو در کل وایب"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky: دسته + مرتب‌سازی + نمای/فیلتر — مخفی در نمای تک‌دسته */}
      {showBrowseToolbar && (
      <div className="sticky top-14 z-20 border-b border-wibe bg-wibe-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-wibe-card/90 lg:top-14">
          <div
            ref={categoryChipsRef}
            className="flex gap-1.5 overflow-x-auto border-b border-wibe/40 px-3 py-2 scrollbar-hide lg:flex-wrap lg:overflow-visible lg:px-0 lg:py-2.5"
          >
            <button
              type="button"
              data-category-chip="all"
              onClick={handleAllCategoriesClick}
              className={`h-8 flex-shrink-0 rounded-full px-3 wibe-caption font-medium transition-colors active:scale-[0.98] ${
                isAllCategoriesSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-wibe bg-wibe-surface text-foreground hover:border-primary/30'
              }`}
            >
              همه
            </button>
            {activeCategories.map((cat) => {
              const isSelected = isCategorySelected(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  data-category-chip={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`h-8 flex-shrink-0 whitespace-nowrap rounded-full px-3 wibe-caption font-medium transition-colors active:scale-[0.98] ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-wibe bg-wibe-surface text-foreground hover:border-primary/30'
                  }`}
                >
                  {cat.icon ? `${cat.icon} ` : ''}
                  {cat.name}
                </button>
              );
            })}
          </div>

        <div className="flex items-center gap-1.5 px-3 py-2 lg:gap-2 lg:px-0">
          <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto rounded-lg bg-wibe-surface p-0.5 scrollbar-hide">
            {BROWSE_MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setBrowseMode(value)}
                className={`h-8 flex-shrink-0 rounded-md px-3 wibe-caption font-medium transition-colors active:scale-[0.98] lg:px-3.5 ${
                  browseMode === value
                    ? 'bg-wibe-card font-semibold text-primary shadow-sm'
                    : 'text-wibe-secondary hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden rounded-lg border border-wibe bg-wibe-surface p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                aria-label="نمایش لیستی"
                aria-pressed={viewMode === 'compact'}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors active:scale-[0.98] ${
                  viewMode === 'compact' ? 'bg-primary text-white' : 'text-wibe-secondary'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="نمایش گریدی"
                aria-pressed={viewMode === 'grid'}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors active:scale-[0.98] ${
                  viewMode === 'grid' ? 'bg-primary text-white' : 'text-wibe-secondary'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 transition-colors active:scale-[0.98] ${
                hasAdvancedFilters
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-wibe bg-wibe-surface text-wibe-secondary hover:border-primary/30'
              }`}
              aria-label="فیلتر و حال‌وهوا"
            >
              <Filter className="h-4 w-4" />
              <span className="wibe-caption font-medium sm:hidden">فیلتر</span>
            </button>
          </div>
        </div>

        {hasAdvancedFilters && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-wibe/40 px-3 py-2 lg:px-0">
            {[...filterState.vibes]
              .filter((v) => v !== 'trending' && v !== 'saved')
              .map((v) => {
                const label = VIBE_CHIPS.find((c) => c.value === v)?.label ?? v;
                return (
                  <span
                    key={v}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 wibe-caption font-medium text-primary"
                  >
                    {label}
                  </span>
                );
              })}
            {filterState.creatorType !== 'all' && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 wibe-caption font-medium text-primary">
                {filterState.creatorType === 'top' && 'کیوریتور برتر'}
                {filterState.creatorType === 'new' && 'تازه‌وارد'}
                {filterState.creatorType === 'viral' && 'وایرال'}
              </span>
            )}
            <button
              type="button"
              onClick={() =>
                setFilterState((s) => ({
                  ...s,
                  ...browseModeToFilter(browseMode),
                  creatorType: 'all',
                  minItemCount: 0,
                  minRating: 0,
                }))
              }
              className="ms-auto wibe-caption font-medium text-primary hover:underline"
            >
              پاک فیلتر
            </button>
          </div>
        )}

        {showContextBar && (
          <p className="hidden border-t border-wibe/40 px-0 py-2 wibe-caption text-wibe-secondary lg:block">
            {contextParts.join(' · ')}
          </p>
        )}
      </div>
      )}

      <div className="mt-2 w-full min-w-0 max-lg:px-3 lg:mt-4 lg:px-0">
        {browseMode === 'saved' && !bookmarksLoaded ? (
          <SavedBookmarksSkeleton />
        ) : savedBrowseEmpty ? (
          <SavedEmptyState onBrowse={() => setBrowseMode('newest')} />
        ) : trendingBrowseEmpty ? (
          <TrendingEmptyState
            onBrowseNewest={() => setBrowseMode('newest')}
            onBrowsePopular={() => setBrowseMode('popular')}
          />
        ) : publicLists.length === 0 ? (
          <EmptyState
            icon="📋"
            title="هنوز لیستی اینجا نیست"
            description="می‌تونی از صفحه خانه چند وایب ذخیره کنی یا اولین لیستت رو خودت بسازی."
            buttonText="ساخت لیست"
            buttonHref="/user-lists?openCreate=1"
          />
        ) : searchLoading && isSearchActive ? (
          <SearchResultSkeleton rows={5} className="max-lg:px-0" />
        ) : isSearchActive && !hasSearchResults && !(search.viewTab === 'lists' && search.loadingMore) ? (
          <SearchEmptyState
            query={searchQuery}
            onClear={() => setSearchQuery('')}
            onResetFilters={() =>
              setFilterState((s) => ({
                ...s,
                ...browseModeToFilter(browseMode),
                creatorType: 'all',
                minItemCount: 0,
                minRating: 0,
              }))
            }
            hasFilters={hasAdvancedFilters || filterState.categories.size > 0}
          />
        ) : sortedLists.length === 0 ? (
          <SearchEmptyState
            query={searchQuery}
            onClear={() => setSearchQuery('')}
            onResetFilters={() =>
              setFilterState((s) => ({
                ...s,
                ...browseModeToFilter(browseMode),
                creatorType: 'all',
                minItemCount: 0,
                minRating: 0,
              }))
            }
            hasFilters={hasAdvancedFilters || filterState.categories.size > 0}
          />
        ) : useSectionLayout ? (
          <>
            {featuredLists.length > 0 && <ListsFeaturedCarousel lists={featuredLists} />}
            {categorySections.map(({ category, lists: sectionLists }, index) => {
              const sectionProps = {
                title: category.name,
                icon: category.icon,
                categoryId: category.id,
                categorySlug: category.slug ?? undefined,
                lists: sectionLists,
                viewMode: displayViewMode,
                isDesktop,
                previewCount: sectionPreviewCount,
                bookmarkedIds,
                onBookmarkToggle: handleBookmarkToggle,
                onShowAllCategory: handleShowAllCategory,
              };

              if (index === 0) {
                return <ListsCategorySection key={category.id} {...sectionProps} />;
              }

              return (
                <HomeDeferredMount
                  key={category.id}
                  fallback={
                    <section className="mb-6" aria-hidden>
                      <div className="mb-3 h-6 w-36 animate-pulse rounded bg-gray-200" />
                      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="aspect-[5/4] animate-pulse rounded-xl bg-gray-100" />
                        ))}
                      </div>
                    </section>
                  }
                >
                  <ListsCategorySectionLazy {...sectionProps} />
                </HomeDeferredMount>
              );
            })}
            {pageSimilarLists.length > 0 && (
              <ListsSimilarRow
                lists={pageSimilarLists}
                bookmarkedIds={bookmarkedIds}
                onBookmarkToggle={handleBookmarkToggle}
              />
            )}
            {canRemotePaginate && hasMoreRemote ? (
              <InfiniteScrollSentinel
                hasMore={hasMoreRemote}
                onLoadMore={fetchMoreRemoteLists}
              />
            ) : null}
          </>
        ) : (
          <>
            {isSearchActive && (hasSearchResults || (search.viewTab === 'lists' && search.loadingMore)) ? (
              <SearchResultsPanelLazy
                query={normalizedSearch}
                queryIntent={search.queryIntent}
                directItems={search.directItems}
                indirectItems={search.indirectItems}
                topPicks={search.topPicks}
                subThemes={search.subThemes}
                similarItems={search.similarItems}
                lists={search.lists}
                totals={search.totals}
                hasMore={search.hasMore}
                viewTab={search.viewTab}
                onTabChange={search.setViewTab}
                onSubThemeClick={setSearchQuery}
                loadingMore={search.viewTab === 'lists' && search.loadingMore}
                highlightQuery={normalizedSearch}
              />
            ) : (
              <>
                {singleCategoryFilter && selectedCategory && (
                  <div className="mb-3 flex items-center justify-between gap-2 lg:mb-4">
                    <h2 className="flex min-w-0 items-center gap-1.5 wibe-h3">
                      {selectedCategory.icon ? (
                        <span aria-hidden>{selectedCategory.icon}</span>
                      ) : null}
                      <span className="truncate">{selectedCategory.name}</span>
                    </h2>
                    <span className="shrink-0 wibe-caption text-wibe-secondary tabular-nums">
                      {sortedLists.length.toLocaleString('fa-IR')} لیست
                    </span>
                  </div>
                )}

                {searchQuery.trim() && (
                  <p className="mb-3 wibe-caption text-wibe-secondary lg:mb-4">
                    {sortedLists.length.toLocaleString('fa-IR')} نتیجه برای «{normalizedSearch}»
                  </p>
                )}

                <FlatListResults
                  lists={visibleFlatLists}
                  viewMode={displayViewMode}
                  isDesktop={isDesktop}
                  bookmarkedIds={bookmarkedIds}
                  onBookmarkToggle={handleBookmarkToggle}
                />
                <InfiniteScrollSentinel hasMore={hasMoreFlat} onLoadMore={loadMoreFlat} />

                {!hasMoreFlat && flatSimilarLists.length > 0 && (
                  <ListsSimilarRow
                    lists={flatSimilarLists}
                    bookmarkedIds={bookmarkedIds}
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {filterSheetOpen ? (
        <FilterBottomSheetPro
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          categories={activeCategories}
          filterState={filterState}
          getResultCount={getResultCount}
          onApply={(state) => {
            setFilterState(state);
            setFilterSheetOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function FlatListResults({
  lists,
  viewMode,
  isDesktop,
  bookmarkedIds,
  onBookmarkToggle,
  highlightQuery,
}: {
  lists: ListWithCategory[];
  viewMode: ViewMode;
  isDesktop: boolean;
  bookmarkedIds?: Set<string>;
  onBookmarkToggle?: (listId: string, isBookmarked: boolean) => void;
  highlightQuery?: string;
}) {
  const cardVariant = resolveListCardVariant(viewMode, isDesktop);

  return (
    <div className={listsResultsGridClass(viewMode, isDesktop)}>
      {lists.map((list, index) => (
        <ListCardCompact
          key={list.id}
          list={list}
          variant={cardVariant}
          showCreator={false}
          isBookmarked={bookmarkedIds?.has(list.id)}
          onBookmarkToggle={onBookmarkToggle}
          highlightQuery={highlightQuery}
          searchResultIndex={highlightQuery ? index : undefined}
        />
      ))}
    </div>
  );
}

function SavedBookmarksSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[80px] bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function TrendingEmptyState({
  onBrowseNewest,
  onBrowsePopular,
}: {
  onBrowseNewest: () => void;
  onBrowsePopular: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-wibe bg-wibe-card/60 px-4 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-2xl">
        🔥
      </div>
      <h3 className="mb-1 wibe-h3 text-foreground">فعلاً لیست ترندی نیست</h3>
      <p className="mx-auto mb-5 max-w-xs wibe-small leading-relaxed text-wibe-secondary">
        هنوز لیستی با برچسب ترند نداریم. جدیدترین‌ها یا محبوب‌ترین‌ها را ببین.
      </p>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onBrowseNewest}
          className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 wibe-small font-semibold text-white transition-transform active:scale-[0.98]"
        >
          مشاهده جدیدترین‌ها
        </button>
        <button
          type="button"
          onClick={onBrowsePopular}
          className="wibe-caption font-medium text-primary hover:underline"
        >
          یا محبوب‌ترین لیست‌ها
        </button>
        <Link href="/user-lists" className="mt-1 wibe-caption font-medium text-wibe-secondary hover:underline">
          رفتن به اکسپلور
        </Link>
      </div>
    </div>
  );
}

function SavedEmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="text-center py-14 px-4 rounded-xl border border-dashed border-wibe bg-wibe-card/60">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bookmark className="w-7 h-7" strokeWidth={1.75} />
      </div>
      <h3 className="wibe-h3 text-foreground mb-1">لیست ذخیره‌شده‌ای نداری</h3>
      <p className="wibe-small text-wibe-secondary max-w-xs mx-auto mb-5 leading-relaxed">
        لیست‌هایی که دوست داری را bookmark کن تا اینجا ببینی
      </p>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onBrowse}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-white wibe-small font-semibold active:scale-[0.98] transition-transform"
        >
          کشف لیست‌ها
        </button>
        <Link href="/login" className="wibe-caption text-primary font-medium hover:underline">
          ورود برای همگام‌سازی ذخیره‌ها
        </Link>
      </div>
    </div>
  );
}

function SearchEmptyState({
  query,
  onClear,
  onResetFilters,
  hasFilters,
}: {
  query: string;
  onClear: () => void;
  onResetFilters: () => void;
  hasFilters: boolean;
}) {
  const trimmed = normalizeSearchQuery(query);
  return (
    <div className="rounded-xl border border-dashed border-wibe bg-wibe-card/60 px-4 py-14 text-center">
      <div className="mx-auto mb-4 text-5xl">🔍</div>
      <h3 className="mb-1 wibe-h3 text-foreground">
        {trimmed ? `نتیجه‌ای برای «${trimmed}» نیست` : 'نتیجه‌ای پیدا نشد'}
      </h3>
      <p className="mx-auto mb-5 max-w-xs wibe-small leading-relaxed text-wibe-secondary">
        {hasFilters
          ? 'فیلترها را کم کن یا عبارت جستجو را عوض کن'
          : 'عبارت دیگری امتحان کن یا از پیشنهادهای جستجو استفاده کن'}
      </p>
      <div className="flex flex-col items-center gap-2">
        {trimmed && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 wibe-small font-semibold text-white transition-transform active:scale-[0.98]"
          >
            پاک کردن جستجو
          </button>
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="wibe-caption font-medium text-primary hover:underline"
          >
            پاک کردن فیلترها
          </button>
        )}
        <Link href="/user-lists?openCreate=1" className="mt-1 wibe-caption font-medium text-wibe-secondary hover:underline">
          ساخت لیست جدید
        </Link>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  buttonText,
  buttonHref,
}: {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="wibe-h3 text-foreground mb-2">{title}</h3>
      <p className="wibe-small text-wibe-secondary mb-6 max-w-sm mx-auto">{description}</p>
      <Link
        href={buttonHref}
        className="inline-block bg-primary text-white px-6 py-3 rounded-md wibe-small font-semibold hover:bg-primary-dark transition-colors"
      >
        {buttonText}
      </Link>
    </div>
  );
}
