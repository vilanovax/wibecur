'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, LayoutGrid, List, ChevronDown, Filter } from 'lucide-react';
import { lists, categories } from '@prisma/client';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardCompact from '@/components/mobile/lists/ListCardCompact';
import FilterBottomSheetPro, {
  type FilterState,
  type VibeFilter,
} from '@/components/mobile/lists/FilterBottomSheetPro';

type ListWithCategory = lists & {
  categories: categories | null;
  saveCount?: number;
  itemCount?: number;
  likeCount?: number;
  viewCount?: number;
  users?: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  _count: {
    items: number;
    list_likes: number;
  };
};

interface ListsPageClientProps {
  lists: ListWithCategory[];
  categories: categories[];
  initialCategory?: string;
  initialSearch?: string;
}

type SortOption = 'newest' | 'popular' | 'most_saved' | 'rising';
type ViewMode = 'grid' | 'compact';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'جدید' },
  { value: 'popular', label: 'محبوب' },
  { value: 'most_saved', label: 'بیشترین ذخیره' },
  { value: 'rising', label: 'در حال رشد' },
];

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

function matchVibe(list: ListWithCategory, vibe: VibeFilter, bookmarkedIds: Set<string>): boolean {
  const title = (list.title || '').toLowerCase();
  const desc = (list.description || '').toLowerCase();
  const text = `${title} ${desc}`;
  switch (vibe) {
    case 'trending':
      return list.badge === 'TRENDING';
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

/** minRating 0=none, 1-5 maps to saveCount threshold (proxy for quality) */
function matchMinRating(list: ListWithCategory, minRating: number): boolean {
  if (minRating <= 0) return true;
  const saveCount = list.saveCount ?? 0;
  const thresholds = [0, 5, 10, 20, 50];
  return saveCount >= (thresholds[minRating - 1] ?? 0);
}

const DISCOVERY_MODES: { value: VibeFilter | null; label: string }[] = [
  { value: 'trending', label: '🔥 ترند' },
  { value: 'saved', label: '⭐ محبوب' },
  { value: null, label: '🆕 جدید' },
];

const DEFAULT_FILTER: FilterState = {
  categories: new Set(),
  sortBy: 'newest',
  vibes: new Set(),
  creatorType: 'all',
  minItemCount: 5,
  minRating: 0,
};

export default function ListsPageClient({
  lists: initialLists,
  categories,
  initialCategory,
  initialSearch,
}: ListsPageClientProps) {
  const categoryById = categories.find((c) => c.id === initialCategory);
  const categoryBySlug = categories.find((c) => 'slug' in c && (c as { slug: string }).slug === initialCategory);
  const resolvedCategoryId = categoryById?.id ?? categoryBySlug?.id ?? null;

  const [filterState, setFilterState] = useState<FilterState>(() => ({
    ...DEFAULT_FILTER,
    categories: resolvedCategoryId ? new Set([resolvedCategoryId]) : new Set(),
  }));
  const [searchQuery, setSearchQuery] = useState(initialSearch ?? '');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Item search results
  interface SearchItem {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    categoryName: string | null;
  }
  const [itemResults, setItemResults] = useState<SearchItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const fetchItems = useCallback(async (q: string) => {
    if (q.length < 2) { setItemResults([]); return; }
    setItemsLoading(true);
    try {
      const res = await fetch(`/api/items/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) setItemResults(data.data);
      else setItemResults([]);
    } catch { setItemResults([]); }
    finally { setItemsLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchItems]);

  const publicLists = initialLists.filter((l) => l.isActive && l.isPublic);
  const activeCategories = categories.filter((c) => c.isActive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const applyFilter = useMemo(() => {
    return (lists: ListWithCategory[], state: FilterState) => {
      return lists.filter((list) => {
        const categoryMatch =
          state.categories.size === 0 ||
          (list.categoryId != null && state.categories.has(list.categoryId));
        const vibeMatch =
          state.vibes.size === 0 ||
          [...state.vibes].some((v) => matchVibe(list, v, bookmarkedIds));
        const creatorMatch = matchCreatorType(list, state.creatorType);
        const itemCountMatch = (list.itemCount ?? list._count?.items ?? 0) >= state.minItemCount;
        const ratingMatch = matchMinRating(list, state.minRating);
        return categoryMatch && vibeMatch && creatorMatch && itemCountMatch && ratingMatch;
      });
    };
  }, [bookmarkedIds]);

  const getResultCount = (state: FilterState) => {
    const searchFiltered = publicLists.filter((list) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        list.title.toLowerCase().includes(q) ||
        (list.description?.toLowerCase() ?? '').includes(q)
      );
    });
    return applyFilter(searchFiltered, state).length;
  };

  const searchPlaceholder = 'جستجو در لیست‌ها، فیلم‌ها، کافه‌ها...';

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
            categories: Array.isArray(parsed.categories)
              ? new Set(parsed.categories)
              : prev.categories,
            sortBy:
              parsed.sortBy && SORT_OPTIONS.some((o) => o.value === parsed.sortBy)
                ? parsed.sortBy
                : prev.sortBy,
            vibes: Array.isArray(parsed.vibes) ? new Set(parsed.vibes) : prev.vibes,
            creatorType: parsed.creatorType ?? prev.creatorType,
            minItemCount: typeof parsed.minItemCount === 'number' ? parsed.minItemCount : prev.minItemCount,
            minRating: typeof parsed.minRating === 'number' ? parsed.minRating : prev.minRating,
          }));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'listsPage_filterState',
      JSON.stringify({
        categories: [...filterState.categories],
        sortBy: filterState.sortBy,
        vibes: [...filterState.vibes],
        creatorType: filterState.creatorType,
        minItemCount: filterState.minItemCount,
        minRating: filterState.minRating,
      })
    );
  }, [filterState]);

  useEffect(() => {
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
      .catch(() => {});
  }, []);

  const searchFiltered = publicLists.filter((list) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      list.title.toLowerCase().includes(q) ||
      (list.description?.toLowerCase() ?? '').includes(q)
    );
  });
  const filteredLists = applyFilter(searchFiltered, filterState);
  const sortedLists = [...filteredLists].sort((a, b) => {
    switch (filterState.sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return (b.likeCount ?? b._count?.list_likes ?? 0) - (a.likeCount ?? a._count?.list_likes ?? 0);
      case 'most_saved':
        return (b.saveCount ?? 0) - (a.saveCount ?? 0);
      case 'rising':
        return (b.saveCount ?? 0) - (a.saveCount ?? 0);
      default:
        return 0;
    }
  });

  const totalCount = publicLists.length;
  const [searchCollapsed, setSearchCollapsed] = useState(false);

  useEffect(() => {
    const onScroll = () => setSearchCollapsed(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const setDiscoveryMode = (v: VibeFilter | null) => {
    setFilterState((s) => ({
      ...s,
      vibes: v ? new Set([v]) : new Set(),
    }));
  };
  const activeDiscovery =
    filterState.vibes.has('trending') ? 'trending' : filterState.vibes.has('saved') ? 'saved' : null;

  return (
    <div className="space-y-0 pb-8">
      {/* LAYER 2 — Smart Search Bar (52px, radius 16, padding 16) */}
      <div className="sticky top-14 z-10 bg-gray-50 pt-3 transition-all">
        <div className="px-4">
          <div
            className={`relative flex items-center bg-white rounded-2xl border border-gray-200 transition-all ${
              searchCollapsed ? 'h-12 px-4' : 'h-[52px] px-4'
            }`}
          >
            <Search className="absolute right-3 w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full pr-11 pl-1 bg-transparent text-[14px] focus:outline-none focus:ring-0 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* LAYER 3 — Category Tabs (44px, gap 20px, count smaller gray) */}
        <div className="mt-4 px-4">
          <div className="flex gap-5 overflow-x-auto scrollbar-hide h-11 items-end">
            <button
              type="button"
              onClick={() => setFilterState((s) => ({ ...s, categories: new Set() }))}
              className="flex-shrink-0 relative pb-2.5 text-[15px] font-medium transition-all whitespace-nowrap"
            >
              <span className={filterState.categories.size === 0 ? 'font-bold text-gray-900' : 'text-gray-600'}>
                همه
              </span>
              <span className="text-[12px] text-gray-500 font-normal mr-0.5">({totalCount})</span>
              {filterState.categories.size === 0 && (
                <span className="absolute bottom-0 right-0 left-0 h-0.5 rounded-full bg-gradient-to-l from-primary to-primary-dark" />
              )}
            </button>
            {activeCategories.map((cat) => {
              const count = publicLists.filter((l) => l.categoryId === cat.id).length;
              const isSelected = filterState.categories.has(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setFilterState((s) => ({ ...s, categories: new Set([cat.id]) }))
                  }
                  className="flex-shrink-0 relative pb-2.5 text-[15px] font-medium transition-all whitespace-nowrap"
                >
                  <span className={isSelected ? 'font-bold text-gray-900' : 'text-gray-600'}>
                    {cat.name}
                  </span>
                  <span className="text-[12px] text-gray-500 font-normal mr-0.5">({count})</span>
                  {isSelected && (
                    <span className="absolute bottom-0 right-0 left-0 h-0.5 rounded-full bg-gradient-to-l from-primary to-primary-dark" />
                  )}
                </button>
              );
            })}
          </div>
        </div>


        {/* LAYER 5 — Control Row (Grid | Sort | Filter, count right) */}
        <div className="mt-3 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}
                aria-label="نمایش گریدی"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 ${viewMode === 'compact' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}
                aria-label="نمایش فشرده"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <span className="text-gray-300 text-sm">•</span>
            <div className="relative">
              <select
                value={filterState.sortBy}
                onChange={(e) =>
                  setFilterState((s) => ({ ...s, sortBy: e.target.value as SortOption }))
                }
                className="text-[13px] font-medium text-gray-700 py-1.5 pr-7 pl-2 rounded-lg border border-gray-200 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[90px]"
                aria-label="مرتب‌سازی"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
            <span className="text-gray-300 text-sm">•</span>
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className="flex items-center gap-1 text-[13px] font-medium text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
              aria-label="فیلتر"
            >
              <Filter className="w-4 h-4" />
              فیلتر
            </button>
          </div>
          <span className="text-[12px] text-gray-500 flex-shrink-0">
            {sortedLists.length} نتیجه
          </span>
        </div>

        {/* Smart Chips Summary - Filter sheet extras (not discovery mode) */}
        {(([...filterState.vibes].some((v) => v !== 'trending' && v !== 'saved') ||
          filterState.creatorType !== 'all' ||
          filterState.minItemCount > 5 ||
          filterState.minRating > 0)) && (
          <div className="mt-2 px-4 flex flex-wrap gap-2">
            {[...filterState.vibes]
              .filter((v) => v !== 'trending' && v !== 'saved')
              .map((v) => {
                const label = VIBE_CHIPS.find((c) => c.value === v)?.label ?? v;
                return (
                  <span
                    key={v}
                    className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {label}
                  </span>
                );
              })}
            {filterState.creatorType !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-primary/10 text-primary border border-primary/20">
                {filterState.creatorType === 'top' && '⭐ کیوریتورهای برتر'}
                {filterState.creatorType === 'new' && '🆕 تازه‌وارد'}
                {filterState.creatorType === 'viral' && '🔥 وایرال'}
              </span>
            )}
            {filterState.minItemCount > 5 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-primary/10 text-primary border border-primary/20">
                حداقل {filterState.minItemCount} آیتم
              </span>
            )}
            {filterState.minRating > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-primary/10 text-primary border border-primary/20">
                ⭐ {filterState.minRating}+ ستاره
              </span>
            )}
          </div>
        )}
      </div>

      {/* Item results when searching */}
      {searchQuery.length >= 2 && (
        <div className="mt-4 px-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
            <span>📦</span>
            آیتم‌ها
            {itemsLoading && <span className="text-xs text-gray-400 font-normal">در حال جستجو...</span>}
          </h3>
          {!itemsLoading && itemResults.length === 0 && (
            <p className="text-xs text-gray-400 mb-4">آیتمی پیدا نشد</p>
          )}
          {itemResults.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
              {itemResults.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="flex-shrink-0 w-[140px] rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all active:opacity-95"
                >
                  <div className="relative aspect-[3/4] w-full bg-gray-100">
                    {item.imageUrl ? (
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        fallbackIcon="📋"
                        fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-2xl opacity-50">📋</div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">{item.title}</p>
                    {item.categoryName && (
                      <p className="text-[10px] text-gray-400 mt-1">{item.categoryName}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="h-px bg-gray-100 mt-1 mb-2" />
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
            <span>📋</span>
            لیست‌ها
          </h3>
        </div>
      )}

      {/* Results - Cards (spacing 20px from controls) */}
      <div className={searchQuery.length >= 2 ? 'px-4' : 'mt-5 px-4'}>
        {publicLists.length === 0 ? (
          <EmptyState
            icon="📋"
            title="هنوز لیستی اینجا نیست"
            description="می‌تونی از صفحه خانه چند وایب ذخیره کنی یا اولین لیستت رو خودت بسازی."
            buttonText="ساخت لیست"
            buttonHref="/user-lists?openCreate=1"
          />
        ) : sortedLists.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="لیستی پیدا نشد 😕"
            description="فیلترها را تغییر بده یا یک لیست جدید بساز"
            buttonText="ساخت لیست"
            buttonHref="/user-lists?openCreate=1"
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {sortedLists.map((list) => (
              <ListCardCompact key={list.id} list={list} variant="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLists.map((list) => (
              <ListCardCompact key={list.id} list={list} variant="compact" />
            ))}
          </div>
        )}
      </div>

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
      <h3 className="text-[18px] font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-[13px] text-gray-500 leading-[1.6] mb-6 max-w-sm mx-auto">{description}</p>
      <Link
        href={buttonHref}
        className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors"
      >
        {buttonText}
      </Link>
    </div>
  );
}
