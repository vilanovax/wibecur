'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, X, Grid, List as ListIcon, Plus, Check, Trash2, RotateCcw } from 'lucide-react';
import Toast from '@/components/shared/Toast';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface List {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  categories: Category | null;
  createdAt: string;
  updatedAt: string;
}

interface Item {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  listId: string;
  catalogItemId: string | null;
  createdAt: string;
  lists: {
    id: string;
    title: string;
    slug: string;
    categoryId: string | null;
    categories: Category | null;
  };
}

export type ExistingListEntry = {
  personalItemId: string;
  catalogItemId: string | null;
  titleKey: string;
};

interface BrowseMeta {
  totals: { totalPublic: number; inList: number; available: number };
  categoryCounts: Record<string, number>;
}

interface AddItemClientProps {
  listId: string;
  listTitle: string;
  categories: Category[];
  lists: List[];
  initialExistingInList: ExistingListEntry[];
  initialTotals: { totalPublic: number; inList: number; available: number };
  canRemoveFromList?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'available-first';
type AvailabilityFilter = 'all' | 'available' | 'in-list';

const CHIP_BASE =
  'flex items-center gap-1.5 h-9 px-3.5 rounded-lg wibe-small font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-[0.98]';

function categoryChipClass(isSelected: boolean) {
  return isSelected
    ? `${CHIP_BASE} bg-primary text-white shadow-sm`
    : `${CHIP_BASE} bg-wibe-card border border-wibe text-foreground shadow-sm hover:border-primary/30`;
}

function availabilityChipClass(isSelected: boolean, tone: 'default' | 'success') {
  if (!isSelected) {
    return `${CHIP_BASE} bg-wibe-card border border-wibe text-foreground shadow-sm hover:border-primary/30`;
  }
  if (tone === 'success') return `${CHIP_BASE} bg-emerald-600 text-white shadow-sm`;
  return `${CHIP_BASE} bg-primary text-white shadow-sm`;
}

const SELECT_CLASS =
  'px-3 py-2 rounded-md border border-wibe bg-wibe-surface wibe-small text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary outline-none';

function findExistingEntry(
  item: Item,
  entries: ExistingListEntry[]
): ExistingListEntry | undefined {
  if (item.catalogItemId) {
    const byCatalog = entries.find((e) => e.catalogItemId === item.catalogItemId);
    if (byCatalog) return byCatalog;
  }
  const titleKey = item.title.trim().toLowerCase();
  return entries.find((e) => e.titleKey === titleKey);
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

async function fetchBrowsePage(
  listId: string,
  page: number,
  params: {
    search: string;
    categoryId: string;
    sourceListId: string;
    availability: AvailabilityFilter;
    sort: SortOption;
    withMeta: boolean;
  }
) {
  const qs = new URLSearchParams({
    page: String(page),
    limit: '24',
    availability: params.availability,
    sort: params.sort === 'available-first' ? 'newest' : params.sort,
  });
  if (params.search) qs.set('search', params.search);
  if (params.categoryId !== 'all') qs.set('categoryId', params.categoryId);
  if (params.sourceListId !== 'all') qs.set('sourceListId', params.sourceListId);
  if (params.withMeta) qs.set('meta', '1');

  const res = await fetch(`/api/user/lists/${listId}/browse-items?${qs}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در بارگذاری');
  }
  return data.data as {
    items: Item[];
    pagination: { page: number; totalPages: number; total: number; hasMore: boolean };
    meta?: BrowseMeta;
  };
}

export default function AddItemClient({
  listId,
  listTitle,
  categories,
  lists,
  initialExistingInList,
  initialTotals,
  canRemoveFromList = true,
}: AddItemClientProps) {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedList, setSelectedList] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('available-first');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [inListEntries, setInListEntries] = useState<ExistingListEntry[]>(initialExistingInList);
  const [totals, setTotals] = useState(initialTotals);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [undoItem, setUndoItem] = useState<Item | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const apiSort = sortBy === 'available-first' ? 'newest' : sortBy;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: [
      'browse-items',
      listId,
      debouncedSearch,
      selectedCategory,
      selectedList,
      availabilityFilter,
      apiSort,
    ],
    queryFn: ({ pageParam }) =>
      fetchBrowsePage(listId, pageParam, {
        search: debouncedSearch,
        categoryId: selectedCategory,
        sourceListId: selectedList,
        availability: availabilityFilter,
        sort: apiSort as SortOption,
        withMeta: pageParam === 1,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    staleTime: 20_000,
  });

  useEffect(() => {
    const meta = data?.pages[0]?.meta;
    if (meta) {
      setTotals(meta.totals);
      setCategoryCounts(meta.categoryCounts);
    }
  }, [data?.pages]);

  const isInList = useCallback(
    (item: Item) => Boolean(findExistingEntry(item, inListEntries)),
    [inListEntries]
  );

  const items = useMemo(() => {
    const merged = data?.pages.flatMap((p) => p.items) ?? [];
    if (sortBy !== 'available-first') return merged;
    return [...merged].sort((a, b) => {
      const aIn = isInList(a) ? 1 : 0;
      const bIn = isInList(b) ? 1 : 0;
      if (aIn !== bIn) return aIn - bIn;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data?.pages, sortBy, isInList]);

  const filteredLists = useMemo(() => {
    if (selectedCategory === 'all') return lists;
    return lists.filter((l) => l.categoryId === selectedCategory);
  }, [lists, selectedCategory]);

  useEffect(() => {
    if (selectedList !== 'all' && !filteredLists.find((l) => l.id === selectedList)) {
      setSelectedList('all');
    }
  }, [filteredLists, selectedList]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, items.length]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const clearUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoItem(null);
  };

  const scheduleUndo = (item: Item) => {
    clearUndo();
    setUndoItem(item);
    undoTimerRef.current = setTimeout(() => setUndoItem(null), 5000);
  };

  const handleAddItem = async (item: Item, opts?: { silent?: boolean }) => {
    setBusyItemId(item.id);
    try {
      const res = await fetch(`/api/user/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, order: 0 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در افزودن آیتم');
      }

      const created = data.data as {
        id: string;
        catalogItemId?: string | null;
        title?: string;
      };
      setInListEntries((prev) => [
        ...prev.filter(
          (e) =>
            e.personalItemId !== created.id &&
            !(created.catalogItemId && e.catalogItemId === created.catalogItemId) &&
            e.titleKey !== item.title.trim().toLowerCase()
        ),
        {
          personalItemId: created.id,
          catalogItemId: created.catalogItemId ?? item.catalogItemId,
          titleKey: (created.title ?? item.title).trim().toLowerCase(),
        },
      ]);
      setTotals((t) => ({
        ...t,
        inList: t.inList + 1,
        available: Math.max(0, t.available - 1),
      }));

      if (!opts?.silent) {
        setToastMessage('به لیست اضافه شد');
        setToastType('success');
        setShowToast(true);
      }
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : 'خطا در افزودن آیتم');
      setToastType('error');
      setShowToast(true);
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemoveItem = async (item: Item, opts?: { forUndo?: boolean }) => {
    const existing = findExistingEntry(item, inListEntries);
    if (!existing) return;

    setBusyItemId(item.id);
    try {
      const res = await fetch(`/api/user/lists/${listId}/items/${existing.personalItemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حذف آیتم');
      }

      setInListEntries((prev) =>
        prev.filter((e) => e.personalItemId !== existing.personalItemId)
      );
      setTotals((t) => ({
        ...t,
        inList: Math.max(0, t.inList - 1),
        available: t.available + 1,
      }));

      if (opts?.forUndo) {
        scheduleUndo(item);
      } else {
        setToastMessage('از لیست حذف شد');
        setToastType('success');
        setShowToast(true);
      }
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : 'خطا در حذف آیتم');
      setToastType('error');
      setShowToast(true);
    } finally {
      setBusyItemId(null);
    }
  };

  const handleToggleItem = (item: Item) => {
    if (busyItemId === item.id) return;
    if (isInList(item)) {
      if (!canRemoveFromList) return;
      void handleRemoveItem(item, { forUndo: true });
    } else {
      void handleAddItem(item);
    }
  };

  const handleUndo = async () => {
    if (!undoItem) return;
    clearUndo();
    await handleAddItem(undoItem, { silent: true });
    setToastMessage('بازگردانی شد');
    setToastType('success');
    setShowToast(true);
  };

  const renderActionButton = (item: Item, compact?: boolean) => {
    const inList = isInList(item);
    const busy = busyItemId === item.id;

    if (inList) {
      if (!canRemoveFromList) {
        return (
          <div
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 wibe-small font-medium text-emerald-800 ${
              compact ? 'py-1.5' : ''
            }`}
          >
            <Check className="h-4 w-4" aria-hidden />
            در لیست
          </div>
        );
      }
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void handleRemoveItem(item, { forUndo: true });
          }}
          disabled={busy}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 wibe-small font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 ${
            compact ? 'py-1.5' : ''
          }`}
        >
          {busy ? 'در حال حذف...' : (
            <>
              <Trash2 className="h-4 w-4" aria-hidden />
              حذف از لیست
            </>
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleAddItem(item);
        }}
        disabled={busy}
        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 wibe-small font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 ${
          compact ? 'py-1.5' : ''
        }`}
      >
        {busy ? 'در حال افزودن...' : (
          <>
            <Plus className="h-4 w-4" aria-hidden />
            افزودن
          </>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-wibe-surface pb-24">
      <div className="sticky top-14 z-40 border-b border-wibe bg-wibe-card/95 backdrop-blur-sm lg:top-14">
        <div className="px-4 py-3 lg:mx-auto lg:max-w-5xl">
          <div className="mb-3 lg:hidden">
            <p className="mt-0.5 wibe-caption text-wibe-secondary">
              <span className="font-medium text-emerald-700">
                {totals.inList.toLocaleString('fa-IR')} در لیست
              </span>
              <span className="mx-1.5 text-wibe-secondary/50">·</span>
              <span>{totals.available.toLocaleString('fa-IR')} قابل افزودن</span>
            </p>
          </div>
          <div className="mb-3 hidden lg:block">
            <h1 className="wibe-h3 truncate">افزودن به {listTitle}</h1>
            <p className="mt-0.5 wibe-caption text-wibe-secondary">
              <span className="font-medium text-emerald-700">
                {totals.inList.toLocaleString('fa-IR')} در لیست
              </span>
              <span className="mx-1.5 text-wibe-secondary/50">·</span>
              <span>{totals.available.toLocaleString('fa-IR')} قابل افزودن</span>
              <span className="mx-1.5 text-wibe-secondary/50">·</span>
              <span>{totals.totalPublic.toLocaleString('fa-IR')} در کاتالوگ</span>
            </p>
          </div>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-wibe-secondary" />
            <input
              type="text"
              placeholder="جستجو در عنوان، توضیح یا لیست مبدأ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-wibe bg-wibe-surface py-2.5 pe-10 ps-10 wibe-small outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="پاک کردن جستجو"
              >
                <X className="h-4 w-4 text-wibe-secondary" />
              </button>
            )}
          </div>

          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setAvailabilityFilter('all')}
              className={availabilityChipClass(availabilityFilter === 'all', 'default')}
            >
              همه
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('available')}
              className={availabilityChipClass(availabilityFilter === 'available', 'default')}
            >
              قابل افزودن ({totals.available.toLocaleString('fa-IR')})
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('in-list')}
              className={availabilityChipClass(availabilityFilter === 'in-list', 'success')}
            >
              <Check className="h-3.5 w-3.5" />
              در لیست ({totals.inList.toLocaleString('fa-IR')})
            </button>
          </div>

          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={categoryChipClass(selectedCategory === 'all')}
            >
              همه دسته‌ها
            </button>
            {categories.map((category) => {
              const count = categoryCounts[category.id] ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={categoryChipClass(selectedCategory === category.id)}
                >
                  <span aria-hidden>{category.icon}</span>
                  <span>
                    {category.name} ({count.toLocaleString('fa-IR')})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              className={`min-w-0 flex-1 ${SELECT_CLASS}`}
            >
              <option value="all">همه لیست‌های عمومی</option>
              {filteredLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={SELECT_CLASS}
            >
              <option value="available-first">اول: قابل افزودن</option>
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="title-asc">عنوان (الف–ی)</option>
              <option value="title-desc">عنوان (ی–الف)</option>
            </select>

            <div className="flex shrink-0 rounded-md border border-wibe bg-gray-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="نمایش گریدی"
                aria-pressed={viewMode === 'grid'}
                className={`rounded-sm p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-wibe-card text-primary shadow-sm' : 'text-wibe-secondary'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="نمایش لیستی"
                aria-pressed={viewMode === 'list'}
                className={`rounded-sm p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-wibe-card text-primary shadow-sm' : 'text-wibe-secondary'
                }`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isFetching && !isFetchingNextPage && (
            <p className="mt-2 wibe-caption text-primary">در حال جستجو...</p>
          )}
        </div>
      </div>

      <div className="p-4 lg:mx-auto lg:max-w-5xl">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 py-10 text-center">
            <p className="wibe-small text-red-700">
              {error instanceof Error ? error.message : 'خطا در بارگذاری'}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-wibe bg-wibe-card py-12 text-center">
            <div className="mb-3 text-5xl" aria-hidden>
              🔍
            </div>
            <p className="wibe-body text-wibe-secondary">آیتمی یافت نشد</p>
            <p className="mt-1 wibe-caption text-wibe-secondary">
              فیلتر یا عبارت جستجو را تغییر دهید
            </p>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
                  : 'space-y-2'
              }
            >
              {items.map((item) => {
                const inList = isInList(item);
                const canToggle = !inList || canRemoveFromList;
                return (
                  <div
                    key={item.id}
                    role={canToggle ? 'button' : undefined}
                    tabIndex={canToggle ? 0 : undefined}
                    onClick={canToggle ? () => handleToggleItem(item) : undefined}
                    onKeyDown={
                      canToggle
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleToggleItem(item);
                            }
                          }
                        : undefined
                    }
                    className={`overflow-hidden rounded-xl border bg-wibe-card shadow-sm transition-all ${
                      inList
                        ? 'border-emerald-300 ring-1 ring-emerald-200/80'
                        : 'border-wibe hover:border-primary/20'
                    } ${canToggle ? 'cursor-pointer active:scale-[0.99]' : ''} ${
                      viewMode === 'list' ? 'flex gap-3 p-2' : ''
                    }`}
                  >
                    <div
                      className={`relative bg-gray-200 ${
                        viewMode === 'grid'
                          ? 'aspect-[4/3]'
                          : 'h-20 w-20 shrink-0 overflow-hidden rounded-lg'
                      }`}
                    >
                      <ImageWithFallback
                        src={item.imageUrl || ''}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        fallbackIcon="📋"
                        fallbackClassName="h-full w-full"
                      />
                      {inList && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-emerald-600/95 px-2 py-0.5 wibe-caption font-semibold text-white shadow-sm">
                          <Check className="h-3 w-3" />
                          در لیست
                        </span>
                      )}
                    </div>

                    <div
                      className={`min-w-0 ${viewMode === 'grid' ? 'p-2.5' : 'flex flex-1 flex-col justify-center py-1'}`}
                    >
                      <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">
                        {item.title}
                      </h3>
                      {item.lists.categories && (
                        <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary">
                          {item.lists.categories.icon} {item.lists.categories.name}
                        </p>
                      )}
                      <p className="line-clamp-1 wibe-caption text-wibe-secondary/80">
                        از: {item.lists.title}
                      </p>
                      {item.description && viewMode === 'list' && (
                        <p className="mt-1 line-clamp-2 wibe-caption text-wibe-secondary">
                          {item.description}
                        </p>
                      )}
                      <div className={viewMode === 'grid' ? 'mt-2' : 'mt-1.5 max-w-xs'}>
                        {renderActionButton(item, viewMode === 'list')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div ref={loadMoreRef} className="py-6 text-center">
              {isFetchingNextPage && (
                <p className="wibe-caption text-wibe-secondary">بارگذاری بیشتر...</p>
              )}
              {!hasNextPage && items.length > 0 && (
                <p className="wibe-caption text-wibe-secondary">همه نتایج نمایش داده شد</p>
              )}
            </div>
          </>
        )}
      </div>

      {undoItem && (
        <div className="fixed bottom-20 left-4 right-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-white shadow-2xl">
          <p className="flex-1 wibe-small">«{undoItem.title}» حذف شد</p>
          <button
            type="button"
            onClick={() => void handleUndo()}
            className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 wibe-caption font-semibold hover:bg-white/25"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            بازگردانی
          </button>
          <button
            type="button"
            onClick={clearUndo}
            className="rounded-lg p-1 hover:bg-white/15"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={2500}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
