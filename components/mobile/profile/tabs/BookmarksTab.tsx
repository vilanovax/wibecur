'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, User, List, MoreVertical } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

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
}

function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

interface BookmarksResponse {
  bookmarks: BookmarkItem[];
  pagination?: { page: number; totalPages: number };
}

async function fetchBookmarks(): Promise<BookmarksResponse> {
  const res = await fetch('/api/user/bookmarks?page=1&limit=50');
  const data = await res.json();
  if (data.success)
    return {
      bookmarks: data.data.bookmarks ?? [],
      pagination: data.data.pagination,
    };
  return { bookmarks: [] };
}

export default function BookmarksTab({ userId }: BookmarksTabProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user', userId, 'bookmarks'],
    queryFn: fetchBookmarks,
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

  if (isLoading && bookmarks.length === 0) {
    return (
      <div className="px-4 space-y-5">
        <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-14 h-14 rounded-full bg-gray-100 animate-pulse shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
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

  if (bookmarks.length === 0) {
    return (
      <div className="px-4 py-8">
        <div className="text-center py-12 rounded-2xl border border-gray-100 bg-gray-50/50">
          <Bookmark className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-800 font-bold text-lg mb-1">هنوز لیستی دنبال نکردی</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            کیوریتورها رو کشف کن و لیست‌های جذاب دنبال کن
          </p>
          <Link
            href="/lists"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm"
          >
            کشف لیست‌ها
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-5 pb-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-gray-900">لیست‌هایی که دنبال می‌کنم</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {bookmarks.length} لیست • {uniqueCreators.length} کیوریتور
        </p>
      </div>

      {/* Creator row */}
      {uniqueCreators.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide -mx-1">
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
      <div className="grid grid-cols-2 gap-4">
        {displayedBookmarks.map((bookmark) => {
          const list = bookmark.list;
          const creator = list.users;
          const likes = list.likeCount ?? list._count?.list_likes ?? 0;
          const views = list.viewCount ?? 0;
          const items = list.itemCount ?? list._count?.items ?? 0;
          const saves = list.saveCount ?? list._count?.bookmarks ?? 0;
          const isRecentlyUpdated =
            Date.now() - new Date(list.updatedAt).getTime() < RECENT_DAYS_MS;

          return (
            <div
              key={bookmark.id}
              className="relative rounded-[20px] overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
              onContextMenu={(e) => {
                e.preventDefault();
                setActionSheet(bookmark);
              }}
            >
              <button
                type="button"
                className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
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
                <div className="relative aspect-[16/9] bg-gray-100">
                  <ImageWithFallback
                    src={list.coverImage ?? ''}
                    alt={list.title}
                    className="w-full h-full object-cover"
                    fallbackIcon={list.categories?.icon}
                    fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-gray-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-2 drop-shadow-md">
                      {list.title}
                    </h3>
                  </div>
                  {isRecentlyUpdated && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
                  )}
                </div>
              </Link>
              <div className="p-3">
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
                <p className="text-[11px] text-gray-500">
                  {items} آیتم • {formatStat(likes)} پسند • {formatStat(views)} بازدید
                </p>
                <Link
                  href={`/lists/${list.slug}`}
                  className="mt-2 inline-block text-xs font-medium text-primary"
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
          className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors"
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
