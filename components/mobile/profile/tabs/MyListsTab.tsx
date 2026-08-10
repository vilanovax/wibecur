'use client';

import { useMemo, useState, useEffect } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserListRecord, UserListFilter, UserListVisibilityCounts } from '@/lib/user-lists';
import { LISTS_UPDATED_EVENT } from '@/lib/profile-events';
import { openHomeCreateSheet } from '@/lib/home-create-sheet';
import MyListCardCompact, { type MyListCardData } from '@/components/mobile/profile/MyListCardCompact';
import MyListsTopCarousel from '@/components/mobile/profile/MyListsTopCarousel';
import MyListsEmptyState from '@/components/mobile/profile/MyListsEmptyState';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import PersonalListSettingsModal from '../PersonalListSettingsModal';

export type ListWithCategory = UserListRecord;

type VisibilityFilter = 'public' | 'private' | 'shared' | null;

const SEARCH_MIN_LISTS = 8;
/** کاروسل برترین فقط روی فیلتر «همه» و وقتی تنوع واقعی هست */
const TOP_CAROUSEL_MIN = 3;

interface MyListsTabProps {
  userId: string;
  initialLists?: UserListRecord[];
  initialTotal?: number;
  initialVisibilityCounts?: UserListVisibilityCounts;
  /** Chip count from SSR; full shared lists load only when filter is active */
  initialSharedCount?: number;
}

interface MyListsResponse {
  lists: ListWithCategory[];
  pagination: { page: number; totalPages: number; total: number };
  counts?: UserListVisibilityCounts;
}

function toApiFilter(filter: VisibilityFilter): UserListFilter {
  if (filter === 'public') return 'public';
  if (filter === 'private') return 'personal';
  return 'all';
}

async function fetchMyLists(pageParam: number, filter: UserListFilter): Promise<MyListsResponse> {
  const params = new URLSearchParams({ page: String(pageParam), limit: '20' });
  if (filter !== 'all') {
    params.set('filter', filter);
  }
  const res = await fetch(`/api/user/my-lists?${params}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در دریافت لیست‌ها');
  }
  return {
    lists: data.data.lists,
    pagination: data.data.pagination,
    counts: data.data.counts,
  };
}

function toCardData(list: ListWithCategory): MyListCardData {
  return {
    id: list.id,
    title: list.title,
    slug: list.slug,
    coverImage: list.coverImage,
    saveCount: list.saveCount ?? list._count?.bookmarks,
    itemCount: list.itemCount ?? list._count?.items,
    likeCount: list.likeCount ?? list._count?.list_likes,
    isPublic: list.isPublic,
    isActive: list.isActive,
    isFeatured: list.isFeatured,
    badge: list.badge,
    categories: list.categories,
    _count: list._count,
  };
}

async function fetchSharedLists(): Promise<{ lists: ListWithCategory[]; total: number }> {
  const res = await fetch('/api/user/shared-lists?page=1&limit=50');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در دریافت لیست‌های مشترک');
  }
  return {
    lists: data.data.lists,
    total: data.data.pagination.total,
  };
}

function pickTopLists(all: ListWithCategory[], limit = 3): MyListCardData[] {
  return [...all]
    .filter(
      (l) =>
        l.isPublic &&
        l.isActive !== false &&
        (l.itemCount ?? l._count?.items ?? 0) > 0
    )
    .sort((a, b) => {
      const savesA = a.saveCount ?? a._count?.bookmarks ?? 0;
      const savesB = b.saveCount ?? b._count?.bookmarks ?? 0;
      if (savesB !== savesA) return savesB - savesA;
      return (b.likeCount ?? b._count?.list_likes ?? 0) - (a.likeCount ?? a._count?.list_likes ?? 0);
    })
    .slice(0, limit)
    .map(toCardData);
}

export default function MyListsTab({
  userId,
  initialLists,
  initialTotal,
  initialVisibilityCounts,
  initialSharedCount = 0,
}: MyListsTabProps) {
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>(null);
  const [selectedList, setSelectedList] = useState<ListWithCategory | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const apiFilter = visibilityFilter === 'shared' ? 'all' : toApiFilter(visibilityFilter);
  const hasInitial =
    Boolean(initialLists?.length) &&
    apiFilter === 'all' &&
    visibilityFilter !== 'shared';

  // Full shared rows only when filter is active (chip uses SSR count)
  const { data: sharedData, isLoading: isSharedLoading } = useQuery({
    queryKey: ['user', userId, 'shared-lists'],
    queryFn: fetchSharedLists,
    staleTime: 30_000,
    enabled: visibilityFilter === 'shared',
  });

  const sharedLists = sharedData?.lists ?? [];
  const sharedCount = sharedData?.total ?? initialSharedCount;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['user', userId, 'my-lists', apiFilter],
    queryFn: ({ pageParam }) => fetchMyLists(pageParam, apiFilter),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    initialData: hasInitial
      ? {
          pages: [
            {
              lists: initialLists!,
              pagination: {
                page: 1,
                totalPages:
                  Math.ceil((initialTotal ?? initialLists!.length) / 20) || 1,
                total: initialTotal ?? initialLists!.length,
              },
              counts: initialVisibilityCounts,
            },
          ],
          pageParams: [1],
        }
      : undefined,
    initialDataUpdatedAt: hasInitial ? Date.now() : undefined,
    refetchOnMount: hasInitial ? false : undefined,
    staleTime: 30_000,
  });

  useEffect(() => {
    const onListsUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: ['user', userId, 'my-lists'] });
      void refetch();
    };
    window.addEventListener(LISTS_UPDATED_EVENT, onListsUpdated);
    return () => window.removeEventListener(LISTS_UPDATED_EVENT, onListsUpdated);
  }, [userId, queryClient, refetch]);

  const lists = data?.pages.flatMap((p) => p.lists) ?? [];
  const hasMore = !!hasNextPage;

  const visibilityCounts = useMemo<UserListVisibilityCounts>(() => {
    const fromQuery = data?.pages.find((page) => page.counts)?.counts;
    if (fromQuery) return fromQuery;
    if (initialVisibilityCounts) return initialVisibilityCounts;
    return {
      public: lists.filter((l) => l.isPublic && l.isActive !== false).length,
      personal: lists.filter((l) => !l.isPublic || l.isActive === false).length,
    };
  }, [data?.pages, initialVisibilityCounts, lists]);

  const publicCount = visibilityCounts.public;
  const personalCount = visibilityCounts.personal;

  const topLists = useMemo(() => {
    if (lists.length === 0) return [];
    return pickTopLists(lists, 3);
  }, [lists]);

  const showTopCarousel =
    topLists.length >= TOP_CAROUSEL_MIN &&
    publicCount >= TOP_CAROUSEL_MIN &&
    visibilityFilter === null &&
    !search.trim();

  const topIds = useMemo(
    () => (showTopCarousel ? new Set(topLists.map((l) => l.id)) : new Set<string>()),
    [showTopCarousel, topLists]
  );

  const displayLists = useMemo(() => {
    if (topIds.size === 0) return lists;
    return lists.filter((l) => !topIds.has(l.id));
  }, [lists, topIds]);

  const listCountHint = initialTotal ?? lists.length;

  const filteredSortedLists = useMemo(() => {
    if (visibilityFilter === 'shared') {
      return [...sharedLists].sort((a, b) => {
        const dateA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const dateB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return dateB - dateA;
      });
    }
    let result = [...displayLists];
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((l) => l.title.toLowerCase().includes(q));
    }
    if (visibilityFilter === 'public') {
      result = result.filter((l) => l.isPublic && l.isActive !== false);
    } else if (visibilityFilter === 'private') {
      result = result.filter((l) => !l.isPublic || l.isActive === false);
    }
    result.sort((a, b) => {
      const dateA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const dateB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return dateB - dateA;
    });
    return result;
  }, [displayLists, search, visibilityFilter, sharedLists]);

  const publicLists = useMemo(
    () => filteredSortedLists.filter((l) => l.isPublic && l.isActive !== false),
    [filteredSortedLists]
  );
  const personalLists = useMemo(
    () => filteredSortedLists.filter((l) => !l.isPublic || l.isActive === false),
    [filteredSortedLists]
  );

  const showGroupedSections =
    !search.trim() && visibilityFilter === null && publicLists.length > 0 && personalLists.length > 0;

  const toggleVisibilityFilter = (next: VisibilityFilter) => {
    setVisibilityFilter((prev) => (prev === next ? null : next));
  };

  const visibilityChips =
    publicCount + personalCount + sharedCount > 0 ? (
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => toggleVisibilityFilter('public')}
          className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 wibe-caption font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
            visibilityFilter === 'public'
              ? 'bg-primary text-white'
              : 'border border-wibe bg-wibe-card text-foreground hover:border-primary/25'
          }`}
        >
          <span>عمومی</span>
          <span className="tabular-nums opacity-90">{publicCount.toLocaleString('fa-IR')}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleVisibilityFilter('private')}
          className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 wibe-caption font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
            visibilityFilter === 'private'
              ? 'bg-foreground text-white'
              : 'border border-wibe bg-wibe-card text-foreground hover:border-primary/25'
          }`}
        >
          <span>شخصی</span>
          <span className="tabular-nums opacity-90">{personalCount.toLocaleString('fa-IR')}</span>
        </button>
        {sharedCount > 0 && (
          <button
            type="button"
            onClick={() => toggleVisibilityFilter('shared')}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 wibe-caption font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
              visibilityFilter === 'shared'
                ? 'bg-primary text-white'
                : 'border border-wibe bg-wibe-card text-foreground hover:border-primary/25'
            }`}
          >
            <span>مشترک</span>
            <span className="tabular-nums opacity-90">{sharedCount.toLocaleString('fa-IR')}</span>
          </button>
        )}
      </div>
    ) : null;

  const openCreate = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setShowCreate(true);
    } else {
      openHomeCreateSheet();
    }
  };

  const handleSettingsClick = (e: React.MouseEvent, list: ListWithCategory) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedList(list);
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
    setSelectedList(null);
    refetch();
  };

  const hidePublicBadge =
    visibilityFilter === 'public' || visibilityFilter === null || showGroupedSections;

  const renderListGrid = (
    items: ListWithCategory[],
    options?: { hideSettings?: boolean; hidePublicBadge?: boolean }
  ) => (
    <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-3">
      {items.map((list) => (
        <MyListCardCompact
          key={list.id}
          list={toCardData(list)}
          hideSettings={options?.hideSettings}
          hidePublicBadge={options?.hidePublicBadge ?? hidePublicBadge}
          onSettingsClick={(e) => handleSettingsClick(e, list)}
        />
      ))}
    </div>
  );

  const createButton = (
    <>
      <button
        type="button"
        onClick={openCreate}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.98] lg:hidden"
        aria-label="ایجاد لیست"
        title="ایجاد لیست"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="hidden h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-white wibe-small font-semibold transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.98] lg:inline-flex"
      >
        <Plus className="h-4 w-4" />
        ایجاد لیست
      </button>
    </>
  );

  const searchField =
    listCountHint >= SEARCH_MIN_LISTS ? (
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wibe-secondary" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در لیست‌ها..."
          className="h-10 w-full rounded-xl border border-wibe bg-wibe-card pe-3 ps-9 wibe-small text-foreground placeholder:text-wibe-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          aria-label="جستجو در لیست‌ها"
        />
      </div>
    ) : null;

  let content: React.ReactNode = null;

  if (isLoading && lists.length === 0 && !hasInitial) {
    content = (
      <div className="space-y-3 px-4 lg:px-0">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[72px] bg-wibe-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  } else if (isError && lists.length === 0) {
    content = (
      <div className="px-4 lg:px-0">
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
          <p className="wibe-small text-red-600">
            {error instanceof Error ? error.message : 'خطا در بارگذاری لیست‌ها'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white wibe-small font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  } else {
    const emptyMessage = 'هنوز لیستی ایجاد نکرده‌اید';

    if (lists.length === 0 && !isLoading) {
      content = (
      <div className="space-y-3 px-4 lg:px-0">
        <MyListsEmptyState
          message={emptyMessage}
          showCreate
          onCreate={openCreate}
        />
      </div>
    );
    } else {
      content = (
        <>
          <div className="space-y-5 px-4 lg:px-0">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                {visibilityChips}
                {createButton}
              </div>
              {searchField}
            </div>

            {isFetching && !isFetchingNextPage && (
              <p className="wibe-caption text-primary -mt-2 px-0">در حال بروزرسانی...</p>
            )}

            {showTopCarousel ? <MyListsTopCarousel lists={topLists} /> : null}

            {filteredSortedLists.length > 0 && (
              <div className="space-y-6">
                {showGroupedSections ? (
                  <>
                    <section>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="wibe-h3 text-foreground">لیست‌های عمومی</h2>
                        <span className="wibe-caption tabular-nums text-wibe-secondary">
                          {publicCount.toLocaleString('fa-IR')}
                        </span>
                      </div>
                      {renderListGrid(publicLists, { hidePublicBadge: true })}
                    </section>
                    <section>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="wibe-h3 text-foreground">لیست‌های شخصی</h2>
                        <span className="wibe-caption tabular-nums text-wibe-secondary">
                          {personalCount.toLocaleString('fa-IR')}
                        </span>
                      </div>
                      {renderListGrid(personalLists, { hidePublicBadge: false })}
                    </section>
                  </>
                ) : (
                  <div>
                    {visibilityFilter === 'public' && (
                      <h2 className="mb-3 wibe-h3 text-foreground">لیست‌های عمومی</h2>
                    )}
                    {visibilityFilter === 'private' && (
                      <h2 className="mb-3 wibe-h3 text-foreground">لیست‌های شخصی</h2>
                    )}
                    {visibilityFilter === 'shared' && (
                      <h2 className="mb-3 wibe-h3 text-foreground">لیست‌های مشترک با من</h2>
                    )}
                    {!visibilityFilter && showTopCarousel && (
                      <h2 className="mb-3 wibe-h3 text-foreground">همه لیست‌ها</h2>
                    )}
                    {renderListGrid(filteredSortedLists, {
                      hideSettings: visibilityFilter === 'shared',
                      hidePublicBadge:
                        visibilityFilter === 'public' || visibilityFilter === null,
                    })}
                  </div>
                )}
              </div>
            )}

            {visibilityFilter === 'private' &&
              !isLoading &&
              filteredSortedLists.length === 0 &&
              personalCount === 0 && (
                <MyListsEmptyState
                  message="لیست شخصی ندارید"
                  showCreate
                  onCreate={openCreate}
                />
              )}

            {search.trim() && filteredSortedLists.length === 0 && displayLists.length > 0 && (
              <p className="wibe-caption text-wibe-secondary py-4 text-center">
                لیستی با این عنوان پیدا نشد
              </p>
            )}

            {showTopCarousel && displayLists.length === 0 && !search.trim() && (
              <p className="wibe-caption text-wibe-secondary text-center py-2">
                فقط {topLists.length.toLocaleString('fa-IR')} لیست برتر دارید
              </p>
            )}
          </div>

          {hasMore &&
            visibilityFilter !== 'shared' &&
            !(visibilityFilter === 'private' && filteredSortedLists.length === 0 && !isLoading) && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mx-4 mt-4 w-[calc(100%-2rem)] py-3 rounded-lg border border-wibe bg-wibe-card wibe-small font-semibold text-primary disabled:opacity-50 active:scale-[0.99] transition-transform"
            >
              {isFetchingNextPage ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
            </button>
          )}
        </>
      );
    }
  }

  return (
    <>
      {content}

      {selectedList && (
        <PersonalListSettingsModal
          isOpen={showSettings}
          onClose={handleSettingsClose}
          list={{
            id: selectedList.id,
            title: selectedList.title,
            description: selectedList.description,
            coverImage: selectedList.coverImage,
            isPublic: selectedList.isPublic,
            itemCount: selectedList.itemCount,
            commentsEnabled: selectedList.commentsEnabled,
          }}
          onUpdate={handleSettingsClose}
          onDelete={() => refetch()}
        />
      )}

      <CreateListForm
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          void refetch();
        }}
      />
    </>
  );
}
