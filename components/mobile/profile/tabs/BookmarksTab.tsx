'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Eye, Heart, Package } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import { categories, lists } from '@prisma/client';

type ListWithCategoryAndCreator = lists & {
  categories: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color'> | null;
  users?: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  _count: {
    items: number;
    list_likes: number;
    bookmarks: number;
  };
};

interface BookmarkItem {
  id: string;
  list: ListWithCategoryAndCreator;
  createdAt: string;
}

interface BookmarksTabProps {
  userId: string;
}

export default function BookmarksTab({ userId }: BookmarksTabProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/bookmarks?page=${page}&limit=20`);
      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setBookmarks(data.data.bookmarks);
        } else {
          setBookmarks((prev) => [...prev, ...data.data.bookmarks]);
        }
        setHasMore(data.data.pagination.page < data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [userId, page]);

  const handleBookmarkToggle = (isBookmarked: boolean) => {
    if (!isBookmarked) fetchBookmarks();
  };

  const displayedBookmarks = showAll ? bookmarks : bookmarks.slice(0, 8);

  if (isLoading && bookmarks.length === 0) {
    return (
      <div className="px-4 space-y-4">
        <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-gray-100">
              <div className="h-40 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="px-4">
        <p className="text-gray-500 text-sm mb-2">لیست‌هایی که دنبال می‌کنید اینجا نمایش داده می‌شوند.</p>
        <div className="text-center py-12 bg-gray-50/80 rounded-2xl border border-gray-100">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">هنوز لیستی ذخیره نکرده‌اید</p>
          <p className="text-gray-400 text-sm mt-1">با ذخیره لیست‌ها، آن‌ها اینجا ظاهر می‌شوند</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4">
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-0.5">لیست‌هایی که دنبال می‌کنم</h2>
        <p className="text-xs text-gray-500">لیست‌های ذخیره‌شده از سایر کیوریتورها</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {displayedBookmarks.map((bookmark) => {
          const list = bookmark.list;
          const creator = list.users;
          const likes = list.likeCount ?? list._count?.list_likes ?? 0;
          const saves = list.saveCount ?? list._count?.bookmarks ?? 0;
          const items = list.itemCount ?? list._count?.items ?? 0;
          const views = list.viewCount ?? 0;

          return (
            <div
              key={bookmark.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <Link href={`/lists/${list.slug}`} className="block">
                <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                  <ImageWithFallback
                    src={list.coverImage ?? ''}
                    alt={list.title}
                    className="w-full h-40 object-cover"
                    fallbackIcon={list.categories?.icon}
                    fallbackClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white font-bold text-sm line-clamp-2 drop-shadow-md">{list.title}</h3>
                  </div>
                </div>
              </Link>
              <div className="p-3">
                {creator && (
                  <Link
                    href={creator.username ? `/u/${creator.username}` : '#'}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 mb-2"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {creator.image ? (
                        <img src={creator.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-200">
                          {(creator.name ?? creator.username ?? '?').charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 truncate">
                      {creator.name || creator.username || 'کیوریتور'}
                    </span>
                  </Link>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    {views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views}
                  </span>
                  <span className="flex items-center gap-0.5 text-red-500">
                    <Heart className="w-3 h-3" />
                    {likes}
                  </span>
                  <span className="flex items-center gap-0.5 text-gray-400">
                    <Package className="w-3 h-3" />
                    {items}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/lists/${list.slug}`}
                    className="text-xs text-[#7C3AED] font-medium hover:underline"
                  >
                    مشاهده لیست
                  </Link>
                  <div className="flex items-center gap-1 text-gray-500 text-xs" aria-label="حذف از ذخیره‌ها">
                    <BookmarkButton
                      listId={list.id}
                      initialIsBookmarked={true}
                      initialBookmarkCount={saves}
                      variant="icon"
                      size="sm"
                      onToggle={handleBookmarkToggle}
                    />
                    <span>حذف از ذخیره‌ها</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showAll && bookmarks.length > 8 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-100"
        >
          مشاهده بیشتر ({bookmarks.length - 8} مورد دیگر)
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
          className="w-full py-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
        </button>
      )}
    </div>
  );
}
