'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, User, List, MoreVertical, RefreshCw } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import type { ProfileBookmarkSSR } from '@/lib/profile-ssr-types';

const ELITE_LEVELS = ['ELITE_CURATOR', 'VIBE_LEGEND'];
const RECENT_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type ListWithMeta = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  itemCount?: number;
  likeCount?: number;
  viewCount?: number;
  saveCount?: number;
  updatedAt: string;
  categories: { id: string; name: string; slug: string; icon: string; color?: string } | null;
  users: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    curatorLevel?: string | null;
  } | null;
  _count?: { items: number; list_likes: number; bookmarks: number };
};

interface BookmarkItem {
  id: string;
  list: ListWithMeta;
  createdAt: string;
}

interface BookmarksTabProps {
  userId: string;
  initialBookmarks?: ProfileBookmarkSSR[];
  initialBookmarksTotal?: number;
}

interface BookmarksResponse {
  bookmarks: BookmarkItem[];
  pagination?: { page: number; totalPages: number };
}

async function fetchBookmarks(): Promise<BookmarksResponse> {
  const res = await fetch('/api/user/bookmarks?page=1&limit=50');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در دریافت ذخیره‌ها');
  }
  return {
    bookmarks: data.data.bookmarks ?? [],
    pagination: data.data.pagination,
  };
}

export default function BookmarksTab({
  userId,
  initialBookmarks,
  initialBookmarksTotal = 0,
}: BookmarksTabProps) {
  const hasInitial = Boolean(initialBookmarks?.length);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user', userId, 'bookmarks'],
    queryFn: fetchBookmarks,
    staleTime: 30_000,
    initialData: hasInitial
      ? {
          bookmarks: initialBookmarks as BookmarkItem[],
          pagination: {
            page: 1,
            totalPages: Math.ceil(initialBookmarksTotal / 50) || 1,
          },
        }
      : undefined,
  });
  const bookmarks = data?.bookmarks ?? [];
  const hasMore = (data?.pagination?.page ?? 1) < (data?.pagination?.totalPages ?? 1);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [actionSheet, setActionSheet] = useState<BookmarkItem | null>(null);

  const handleBookmarkToggle = (isBookmarked: boolean) => {
    if (!isBookmarked) {
      refetch();
      setActionSheet(null);
    }
  };

  const displayedBookmarks = showAll ? bookmarks : bookmarks.slice(0, 12);

  const uniqueCreators = Array.from(
    new Map(
      bookmarks
        .filter((b) => b.list.users)
        .map((b) => [b.list.users!.id, { ...b.list.users!, listCount: 0 }])
    ).values()
  ).slice(0, 10);

  if (isLoading && bookmarks.length === 0 && !hasInitial) {
    return (
      <div className="space-y-5 px-4 lg:px-0">
        <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-14 h-14 rounded-full bg-gray-100 animate-pulse shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-[20px] overflow-hidden bg-gray-100 animate-pulse">
              <div className="aspect-[16/9] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError && bookmarks.length === 0) {
    return (
      <div className="px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
          <p className="wibe-small text-red-600">
            {error instanceof Error ? error.message : 'خطا در بارگذاری ذخیره‌ها'}
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

  if (bookmarks.length === 0 && !isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="text-center py-12 rounded-lg border border-wibe bg-wibe-card">
          <Bookmark className="w-14 h-14 text-wibe-secondary mx-auto mb-4" />
          <h3 className="wibe-h3 text-foreground mb-1">هنوز لیستی ذخیره نکردی</h3>
          <p className="wibe-small text-wibe-secondary max-w-xs mx-auto mb-6">
            لیست‌های جذاب را کشف کن و ذخیره کن
          </p>
          <Link
            href="/lists"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-primary text-white wibe-small font-medium"
          >
            کشف لیست‌ها
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pb-4 lg:px-0">
      {/* Header */}
      <div className="lg:flex lg:items-end lg:justify-between lg:gap-4">
        <div>
          <h2 className="wibe-h3">لیست‌های ذخیره‌شده</h2>
          <p className="mt-0.5 wibe-small text-wibe-secondary">
            {bookmarks.length.toLocaleString('fa-IR')} لیست •{' '}
            {uniqueCreators.length.toLocaleString('fa-IR')} کیوریتور
          </p>
        </div>
      </div>

      {/* Creator row */}
      {uniqueCreators.length > 0 && (
        <div className="-mx-1 flex gap-4 overflow-x-auto pb-1 scrollbar-hide lg:mx-0 lg:flex-wrap lg:gap-3 lg:overflow-visible">
          {uniqueCreators.map((creator) => (
            <Link
              key={creator.id}
              href={creator.username ? `/u/${creator.username}` : '#'}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                {creator.image ? (
                  <Image
                    src={creator.image}
                    alt=""
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500">
                    {(creator.name ?? creator.username ?? '?').charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-gray-700 truncate max-w-[64px] text-center">
                {creator.name || creator.username || 'کیوریتور'}
              </span>
              {creator.curatorLevel && ELITE_LEVELS.includes(creator.curatorLevel) && (
                <span className="text-[9px] text-amber-600 font-medium">Elite</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="-mx-1 grid grid-cols-2 gap-2 sm:-mx-4 sm:px-0 lg:mx-0 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
        {displayedBookmarks.map((bookmark) => {
          const list = bookmark.list;
          const creator = list.users;
          const items = list.itemCount ?? list._count?.items ?? 0;
          const saves = list.saveCount ?? list._count?.bookmarks ?? 0;
          const isRecentlyUpdated =
            Date.now() - new Date(list.updatedAt).getTime() < RECENT_DAYS_MS;

          return (
            <div
              key={bookmark.id}
              className="relative overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-transform active:scale-[0.99] lg:hover:border-primary/15 lg:hover:shadow-md"
              onContextMenu={(e) => {
                e.preventDefault();
                setActionSheet(bookmark);
              }}
            >
              <button
                type="button"
                className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white lg:left-auto lg:right-2 lg:top-2 lg:bg-wibe-surface/90 lg:text-wibe-secondary lg:hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActionSheet(bookmark);
                }}
                aria-label="عملیات بیشتر"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              <Link href={`/lists/${list.slug}`} className="block">
                <div className="relative aspect-[4/3] bg-gray-100 lg:aspect-[16/10] lg:max-h-[9.5rem]">
                  <ListCoverImage
                    coverImage={list.coverImage}
                    title={list.title}
                    slug={list.slug}
                    categorySlug={list.categories?.slug}
                    className="w-full h-full object-cover"
                    fallbackIcon={list.categories?.icon}
                    fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-gray-200"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent lg:hidden" />
                  <div className="absolute bottom-2 left-2 right-2 lg:hidden">
                    <h3 className="line-clamp-2 wibe-small font-semibold leading-tight text-white">
                      {list.title}
                    </h3>
                    <ListCardStats saves={saves} itemCount={items} variant="overlay" className="mt-0.5" />
                  </div>
                  {isRecentlyUpdated && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
                  )}
                </div>
              </Link>
              <div className="p-2 lg:p-2.5">
                <h3 className="mb-1 hidden line-clamp-2 wibe-small font-semibold text-foreground lg:block">
                  {list.title}
                </h3>
                <ListCardStats
                  saves={saves}
                  itemCount={items}
                  variant="compact"
                  className="mb-1.5 hidden lg:flex"
                />
                {creator && (
                  <Link
                    href={creator.username ? `/u/${creator.username}` : '#'}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 mb-2"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {creator.image ? (
                        <Image
                          src={creator.image}
                          alt=""
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[10px] font-medium text-gray-500">
                          {(creator.name ?? creator.username ?? '?').charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate flex-1">
                      {creator.name || creator.username || 'کیوریتور'}
                      {creator.curatorLevel && ELITE_LEVELS.includes(creator.curatorLevel) && (
                        <span className="text-amber-600 font-normal"> • Elite</span>
                      )}
                    </span>
                  </Link>
                )}
                <Link
                  href={`/lists/${list.slug}`}
                  className="mt-1 inline-block text-xs font-medium text-primary lg:mt-0 lg:wibe-caption"
                >
                  مشاهده لیست
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {!showAll && bookmarks.length > 12 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 lg:max-w-xs lg:mx-auto"
        >
          مشاهده بیشتر ({bookmarks.length - 12} مورد دیگر)
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
          className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
        >
          {isLoading ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
        </button>
      )}

      {/* Long-press / menu action sheet */}
      <BottomSheet
        isOpen={!!actionSheet}
        onClose={() => setActionSheet(null)}
        title="عملیات"
        maxHeight="40vh"
      >
        {actionSheet && (
          <div className="py-2">
            <Link
              href={`/lists/${actionSheet.list.slug}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setActionSheet(null)}
            >
              <List className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-800">مشاهده لیست</span>
            </Link>
            {actionSheet.list.users?.username && (
              <Link
                href={`/u/${actionSheet.list.users.username}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors"
                onClick={() => setActionSheet(null)}
              >
                <User className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-800">مشاهده پروفایل کیوریتور</span>
              </Link>
            )}
            <div className="border-t border-gray-100 my-2" />
            <div className="px-2">
              <BookmarkButton
                listId={actionSheet.list.id}
                initialIsBookmarked={true}
                initialBookmarkCount={actionSheet.list.saveCount ?? 0}
                variant="button"
                size="sm"
                labelSaved="حذف از دنبال‌شده‌ها"
                onToggle={handleBookmarkToggle}
              />
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
