'use client';

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import SearchInput from '@/components/mobile/search/SearchInput';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileListRecord, UserListFilter, UserListVisibilityCounts } from '@/lib/user-lists';
import { PROFILE_LISTS_PAGE_SIZE } from '@/lib/user-lists';
import { LISTS_UPDATED_EVENT } from '@/lib/profile-events';
import { openHomeCreateSheet } from '@/lib/home-create-sheet';
import MyListCardCompact, { type MyListCardData } from '@/components/mobile/profile/MyListCardCompact';
import MyListsTopCarousel from '@/components/mobile/profile/MyListsTopCarousel';
import MyListsEmptyState from '@/components/mobile/profile/MyListsEmptyState';

const CreateListForm = dynamic(() => import('@/components/mobile/user-lists/CreateListForm'), {
  ssr: false,
});
const PersonalListSettingsModal = dynamic(() => import('../PersonalListSettingsModal'), {
  ssr: false,
});

export type ListWithCategory = ProfileListRecord;

type VisibilityFilter = 'public' | 'private' | 'shared' | null;

const SEARCH_MIN_LISTS = 8;
/** هایلایت فقط وقتی دست‌کم سه لیست عمومی هست؛ روی موبایل دوتایش دیده می‌شود */
const TOP_CAROUSEL_MIN = 3;
const HIGHLIGHT_MOBILE = 2;
const HIGHLIGHT_DESKTOP = 3;

interface MyListsTabProps {
  userId: string;
  initialLists?: ListWithCategory[];
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
  const params = new URLSearchParams({
    page: String(pageParam),
    limit: String(PROFILE_LISTS_PAGE_SIZE),
  });
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
    saveCount: list.saveCount ?? 0,
    itemCount: list.itemCount ?? 0,
    likeCount: list.likeCount ?? 0,
    isPublic: list.isPublic,
    isActive: list.isActive,
    isFeatured: list.isFeatured,
    badge: list.badge,
    categories: list.categories
      ? {
          name: list.categories.name,
          icon: list.categories.icon,
          slug: list.categories.slug,
        }
      : null,
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
        (l.itemCount ?? 0) > 0
    )
    .sort((a, b) => {
      const savesA = a.saveCount ?? 0;
      const savesB = b.saveCount ?? 0;
      if (savesB !== savesA) return savesB - savesA;
      return (b.likeCount ?? 0) - (a.likeCount ?? 0);
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
  const [highlightCount, setHighlightCount] = useState(HIGHLIGHT_MOBILE);
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
                  Math.ceil((initialTotal ?? initialLists!.length) / PROFILE_LISTS_PAGE_SIZE) || 1,
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
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setHighlightCount(mq.matches ? HIGHLIGHT_DESKTOP : HIGHLIGHT_MOBILE);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

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

  const rankedTop = useMemo(
    () => (lists.length === 0 ? [] : pickTopLists(lists, HIGHLIGHT_DESKTOP)),
    [lists]
  );
  const topLists = useMemo(
    () => rankedTop.slice(0, highlightCount),
    [rankedTop, highlightCount]
  );

  const showTopCarousel =
    rankedTop.length >= TOP_CAROUSEL_MIN &&
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
      <>
        <Button
          type="button"
          size="sm"
          variant={visibilityFilter === null ? 'default' : 'outline'}
          className="h-11 px-2"
          aria-pressed={visibilityFilter === null}
          onClick={() => setVisibilityFilter(null)}
        >
          <span>همه</span>
          <span className="tabular-nums">{(publicCount + personalCount).toLocaleString('fa-IR')}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={visibilityFilter === 'public' ? 'default' : 'outline'}
          className="h-11 px-2"
          onClick={() => toggleVisibilityFilter('public')}
        >
          <span>عمومی</span>
          <span className="tabular-nums">{publicCount.toLocaleString('fa-IR')}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={visibilityFilter === 'private' ? 'default' : 'outline'}
          className="h-11 px-2"
          onClick={() => toggleVisibilityFilter('private')}
        >
          <span>شخصی</span>
          <span className="tabular-nums">{personalCount.toLocaleString('fa-IR')}</span>
        </Button>
        {sharedCount > 0 && (
          <Button
            type="button"
            size="sm"
            variant={visibilityFilter === 'shared' ? 'default' : 'outline'}
            className="h-11"
            onClick={() => toggleVisibilityFilter('shared')}
          >
            <span>مشترک</span>
            <span className="tabular-nums">{sharedCount.toLocaleString('fa-IR')}</span>
          </Button>
        )}
      </>
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
      <Button
        type="button"
        variant="brand"
        size="sm"
        onClick={openCreate}
        className="h-11 shrink-0 rounded-xl px-2 lg:hidden"
      >
        <Plus />
        ساخت لیست
      </Button>
      <Button
        type="button"
        variant="brand"
        size="lg"
        onClick={() => setShowCreate(true)}
        className="hidden shrink-0 lg:inline-flex"
      >
        <Plus />
        ایجاد لیست
      </Button>
    </>
  );

  const searchField =
    listCountHint >= SEARCH_MIN_LISTS ? (
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="جستجو در لیست‌ها…"
        aria-label="جستجو در لیست‌ها"
      />
    ) : null;

  let content: React.ReactNode = null;

  if (isLoading && lists.length === 0 && !hasInitial) {
    content = (
      <div className="space-y-3 px-4 lg:px-0">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  } else if (isError && lists.length === 0) {
    content = (
      <div className="px-4 lg:px-0">
        <EmptyState
          title="لیست‌ها بارگذاری نشد"
          description={error instanceof Error ? error.message : 'خطا در بارگذاری لیست‌ها'}
          action={
            <Button type="button" variant="brand" size="lg" onClick={() => refetch()}>
              <RefreshCw />
              تلاش مجدد
            </Button>
          }
        />
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
              <div className="flex flex-wrap items-center gap-1">
                {createButton}
                {visibilityChips}
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
                      <div className="mb-3 flex items-baseline gap-2">
                        <h2 className="wibe-h3 text-foreground">لیست‌های عمومی</h2>
                        <span className="wibe-caption tabular-nums text-muted-foreground">
                          {publicCount.toLocaleString('fa-IR')}
                        </span>
                      </div>
                      {renderListGrid(publicLists, { hidePublicBadge: true })}
                    </section>
                    <section>
                      <div className="mb-3 flex items-baseline gap-2">
                        <h2 className="wibe-h3 text-foreground">لیست‌های شخصی</h2>
                        <span className="wibe-caption tabular-nums text-muted-foreground">
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
              <p className="wibe-caption text-muted-foreground py-4 text-center">
                لیستی با این عنوان پیدا نشد
              </p>
            )}

            {showTopCarousel && displayLists.length === 0 && !search.trim() && (
              <p className="wibe-caption text-muted-foreground text-center py-2">
                فقط {topLists.length.toLocaleString('fa-IR')} لیست برتر دارید
              </p>
            )}
          </div>

          {hasMore &&
            visibilityFilter !== 'shared' &&
            !(visibilityFilter === 'private' && filteredSortedLists.length === 0 && !isLoading) && (
            <div className="px-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mt-4 w-full"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'در حال بارگذاری…' : 'بارگذاری بیشتر'}
              </Button>
            </div>
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

      {showCreate ? (
        <CreateListForm
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            void refetch();
          }}
        />
      ) : null}
    </>
  );
}
