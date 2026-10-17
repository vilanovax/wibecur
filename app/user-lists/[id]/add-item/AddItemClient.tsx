'use client';

import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, X, Grid, List as ListIcon, Plus, Check, Trash2, RotateCcw } from 'lucide-react';
import Toast from '@/components/shared/Toast';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import SearchInput from '@/components/mobile/search/SearchInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

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

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? 'default' : 'outline'}
      className="h-11 shrink-0"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

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

  const renderActionButton = (item: Item) => {
    const inList = isInList(item);
    const busy = busyItemId === item.id;

    if (inList) {
      if (!canRemoveFromList) {
        return (
          <div className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-muted text-sm font-semibold text-foreground">
            <Check className="size-4" aria-hidden />
            در لیست
          </div>
        );
      }
      return (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            void handleRemoveItem(item, { forUndo: true });
          }}
          disabled={busy}
        >
          {busy ? 'در حال حذف…' : (
            <>
              <Trash2 aria-hidden />
              حذف از لیست
            </>
          )}
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="brand"
        size="lg"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          void handleAddItem(item);
        }}
        disabled={busy}
      >
        {busy ? 'در حال افزودن…' : (
          <>
            <Plus aria-hidden />
            افزودن
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-3 lg:mx-auto lg:max-w-5xl">
          <div className="mb-3 lg:hidden">
            <p className="mt-0.5 wibe-caption text-muted-foreground">
              <span className="font-medium text-brand">
                {totals.inList.toLocaleString('fa-IR')} در لیست
              </span>
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              <span>{totals.available.toLocaleString('fa-IR')} قابل افزودن</span>
            </p>
          </div>
          <div className="mb-3 hidden lg:block">
            <h1 className="wibe-h3 truncate">افزودن به {listTitle}</h1>
            <p className="mt-0.5 wibe-caption text-muted-foreground">
              <span className="font-medium text-brand">
                {totals.inList.toLocaleString('fa-IR')} در لیست
              </span>
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              <span>{totals.available.toLocaleString('fa-IR')} قابل افزودن</span>
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              <span>{totals.totalPublic.toLocaleString('fa-IR')} در کاتالوگ</span>
            </p>
          </div>

          <div className="mb-3">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="جستجو در عنوان، توضیح یا لیست مبدأ…"
              aria-label="جستجو در آیتم‌ها"
            />
          </div>

          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            <FilterChip selected={availabilityFilter === 'all'} onClick={() => setAvailabilityFilter('all')}>
              همه
            </FilterChip>
            <FilterChip
              selected={availabilityFilter === 'available'}
              onClick={() => setAvailabilityFilter('available')}
            >
              قابل افزودن ({totals.available.toLocaleString('fa-IR')})
            </FilterChip>
            <FilterChip
              selected={availabilityFilter === 'in-list'}
              onClick={() => setAvailabilityFilter('in-list')}
            >
              <Check aria-hidden />
              در لیست ({totals.inList.toLocaleString('fa-IR')})
            </FilterChip>
          </div>

          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            <FilterChip selected={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')}>
              همه دسته‌ها
            </FilterChip>
            {categories.map((category) => {
              const count = categoryCounts[category.id] ?? 0;
              if (count === 0) return null;
              return (
                <FilterChip
                  key={category.id}
                  selected={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span aria-hidden>{category.icon}</span>
                  <span>
                    {category.name} ({count.toLocaleString('fa-IR')})
                  </span>
                </FilterChip>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="min-w-0 flex-1">
              <Select
                value={selectedList}
                onChange={(e) => setSelectedList(e.target.value)}
                className="h-12"
                aria-label="لیست مبدأ"
                options={[
                  { value: 'all', label: 'همه لیست‌های عمومی' },
                  ...filteredLists.map((list) => ({ value: list.id, label: list.title })),
                ]}
              />
            </div>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-12"
              aria-label="مرتب‌سازی"
              options={[
                { value: 'available-first', label: 'اول: قابل افزودن' },
                { value: 'newest', label: 'جدیدترین' },
                { value: 'oldest', label: 'قدیمی‌ترین' },
                { value: 'title-asc', label: 'عنوان (الف–ی)' },
                { value: 'title-desc', label: 'عنوان (ی–الف)' },
              ]}
            />

            <SegmentedControl
              aria-label="نوع نمایش"
              size="sm"
              value={viewMode}
              onChange={(value) => setViewMode(value as 'grid' | 'list')}
              options={[
                { value: 'grid', label: <Grid aria-hidden />, 'aria-label': 'نمایش گریدی' },
                { value: 'list', label: <ListIcon aria-hidden />, 'aria-label': 'نمایش لیستی' },
              ]}
            />
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
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="بارگذاری انجام نشد"
            description={error instanceof Error ? error.message : 'خطا در بارگذاری'}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Search}
            title="آیتمی یافت نشد"
            description="فیلتر یا عبارت جستجو را عوض کن."
          />
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
                  <Card
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
                    className={`overflow-hidden bg-popover p-0 ${
                      inList ? 'border-brand ring-1 ring-brand/30' : ''
                    } ${canToggle ? 'cursor-pointer active:scale-[0.99]' : ''} ${
                      viewMode === 'list' ? 'flex gap-3 p-2' : ''
                    }`}
                  >
                    <div
                      className={`relative bg-muted ${
                        viewMode === 'grid'
                          ? 'aspect-[4/3]'
                          : 'size-20 shrink-0 overflow-hidden rounded-xl'
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
                        <span className="absolute end-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-foreground">
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
                        <p className="mt-0.5 line-clamp-1 wibe-caption text-muted-foreground">
                          {item.lists.categories.icon} {item.lists.categories.name}
                        </p>
                      )}
                      <p className="line-clamp-1 wibe-caption text-muted-foreground/80">
                        از: {item.lists.title}
                      </p>
                      {item.description && viewMode === 'list' && (
                        <p className="mt-1 line-clamp-2 wibe-caption text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      <div className={viewMode === 'grid' ? 'mt-2' : 'mt-1.5 max-w-xs'}>
                        {renderActionButton(item)}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div ref={loadMoreRef} className="py-6 text-center">
              {isFetchingNextPage && (
                <p className="wibe-caption text-muted-foreground">بارگذاری بیشتر...</p>
              )}
              {!hasNextPage && items.length > 0 && (
                <p className="wibe-caption text-muted-foreground">همه نتایج نمایش داده شد</p>
              )}
            </div>
          </>
        )}
      </div>

      {undoItem && (
        <div className="fixed inset-x-4 bottom-20 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-popover px-4 py-3 text-foreground shadow-overlay">
          <p className="min-w-0 flex-1 text-sm">«{undoItem.title}» حذف شد</p>
          <Button type="button" variant="brand" size="sm" className="h-11" onClick={() => void handleUndo()}>
            <RotateCcw aria-hidden />
            بازگردانی
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            onClick={clearUndo}
            aria-label="بستن"
          >
            <X />
          </Button>
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
