'use client';

import { useMemo, useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { UserListRecord } from '@/lib/user-lists';
import { LISTS_UPDATED_EVENT } from '@/lib/profile-events';
import MyListCardCompact, { type MyListCardData } from '@/components/mobile/profile/MyListCardCompact';
import MyListsTopCarousel from '@/components/mobile/profile/MyListsTopCarousel';
import MyListsEmptyState from '@/components/mobile/profile/MyListsEmptyState';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';
import PersonalListSettingsModal from '../PersonalListSettingsModal';

export type ListWithCategory = UserListRecord;

type FilterType = 'all' | 'public' | 'private' | 'draft';

interface MyListsTabProps {
  userId: string;
  initialLists?: UserListRecord[];
  initialTotal?: number;
}

interface MyListsResponse {
  lists: ListWithCategory[];
  pagination: { page: number; totalPages: number; total: number };
}

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'public', label: 'عمومی' },
  { id: 'private', label: 'خصوصی' },
  { id: 'draft', label: 'پیش‌نویس' },
];

async function fetchMyLists(pageParam: number, filter: FilterType): Promise<MyListsResponse> {
  const params = new URLSearchParams({ page: String(pageParam), limit: '20' });
  if (filter !== 'all') params.set('filter', filter);
  const res = await fetch(`/api/user/my-lists?${params}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در دریافت لیست‌ها');
  }
  return {
    lists: data.data.lists,
    pagination: data.data.pagination,
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
    isFeatured: list.isFeatured,
    badge: list.badge,
    categories: list.categories,
    _count: list._count,
  };
}

function pickTopLists(all: ListWithCategory[], limit = 3): MyListCardData[] {
  return [...all]
    .sort((a, b) => {
      const savesA = a.saveCount ?? a._count?.bookmarks ?? 0;
      const savesB = b.saveCount ?? b._count?.bookmarks ?? 0;
      if (savesB !== savesA) return savesB - savesA;
      return (b.likeCount ?? b._count?.list_likes ?? 0) - (a.likeCount ?? a._count?.list_likes ?? 0);
    })
    .slice(0, limit)
    .map(toCardData);
}

export default function MyListsTab({ userId, initialLists, initialTotal }: MyListsTabProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedList, setSelectedList] = useState<ListWithCategory | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const hasInitial = Boolean(initialLists?.length);

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
    queryKey: ['user', userId, 'my-lists', filter],
    queryFn: ({ pageParam }) => fetchMyLists(pageParam, filter),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    initialData:
      filter === 'all' && hasInitial
        ? {
            pages: [
              {
                lists: initialLists!,
                pagination: {
                  page: 1,
                  totalPages: Math.ceil((initialTotal ?? initialLists!.length) / 20) || 1,
                  total: initialTotal ?? initialLists!.length,
                },
              },
            ],
            pageParams: [1],
          }
        : undefined,
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
  const totalCount = data?.pages[0]?.pagination.total ?? lists.length;
  const hasMore = !!hasNextPage;

  const topLists = useMemo(() => {
    if (filter !== 'all' || lists.length === 0) return [];
    return pickTopLists(lists, 3);
  }, [lists, filter]);

  const topIds = useMemo(() => new Set(topLists.map((l) => l.id)), [topLists]);

  const displayLists = useMemo(() => {
    if (filter !== 'all' || topLists.length === 0) return lists;
    return lists.filter((l) => !topIds.has(l.id));
  }, [lists, filter, topLists.length, topIds]);

  const publicCount = useMemo(
    () => (filter === 'all' ? lists.filter((l) => l.isPublic).length : 0),
    [lists, filter]
  );

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

  const filterChips = (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => setFilter(f.id)}
          className={`shrink-0 h-8 px-3 rounded-full wibe-small font-medium transition-all ${
            filter === f.id
              ? 'bg-primary text-white shadow-sm'
              : 'bg-wibe-card border border-wibe text-wibe-secondary'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  const createButton = (
    <button
      type="button"
      onClick={() => setShowCreate(true)}
      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white wibe-caption font-semibold shrink-0 active:scale-[0.98] transition-transform"
    >
      <Plus className="w-3.5 h-3.5" />
      جدید
    </button>
  );

  if (isLoading && lists.length === 0 && !hasInitial) {
    return (
      <div className="px-4 space-y-3">
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-16 bg-gray-200 rounded-full animate-pulse shrink-0" />
          ))}
        </div>
        <div className="flex gap-2.5 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 w-[140px] bg-gray-200 rounded-lg animate-pulse shrink-0" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[72px] bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && lists.length === 0) {
    return (
      <div className="px-4">
        {filterChips}
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
  }

  const emptyMessage =
    filter === 'draft'
      ? 'پیش‌نویسی ندارید'
      : filter === 'private'
        ? 'لیست خصوصی ندارید'
        : filter === 'public'
          ? 'لیست عمومی ندارید'
          : 'هنوز لیستی ایجاد نکرده‌اید';

  if (lists.length === 0 && !isLoading) {
    return (
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          {filterChips}
          {filter !== 'draft' && createButton}
        </div>
        <MyListsEmptyState
          message={emptyMessage}
          showCreate={filter !== 'draft'}
          onCreate={() => setShowCreate(true)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">{filterChips}</div>
          {createButton}
        </div>

        {filter === 'all' && totalCount > 0 && (
          <p className="wibe-caption text-wibe-secondary -mt-1">
            {totalCount.toLocaleString('fa-IR')} لیست
            {publicCount > 0 && ` · ${publicCount.toLocaleString('fa-IR')} عمومی`}
            {isFetching && !isFetchingNextPage && (
              <span className="text-primary mr-1"> · در حال بروزرسانی...</span>
            )}
          </p>
        )}

        {filter === 'all' && topLists.length > 0 && <MyListsTopCarousel lists={topLists} />}

        {displayLists.length > 0 && (
          <div>
            {filter === 'all' && topLists.length > 0 && (
              <h2 className="wibe-h3 mb-2.5">همه لیست‌ها</h2>
            )}
            <div className="space-y-2">
              {displayLists.map((list) => (
                <MyListCardCompact
                  key={list.id}
                  list={toCardData(list)}
                  onSettingsClick={(e) => handleSettingsClick(e, list)}
                />
              ))}
            </div>
          </div>
        )}

        {filter === 'all' && topLists.length > 0 && displayLists.length === 0 && (
          <p className="wibe-caption text-wibe-secondary text-center py-2">
            فقط {topLists.length.toLocaleString('fa-IR')} لیست برتر دارید
          </p>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-4 mt-4 w-[calc(100%-2rem)] py-3 rounded-lg border border-wibe bg-wibe-card wibe-small font-semibold text-primary disabled:opacity-50 active:scale-[0.99] transition-transform"
        >
          {isFetchingNextPage ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
        </button>
      )}

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
