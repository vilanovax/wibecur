'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { categories, lists } from '@prisma/client';

type ListWithCategory = lists & {
  categories: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color'>;
  _count: {
    items: number;
    list_likes: number;
    bookmarks: number;
  };
};

interface BookmarkItem {
  id: string;
  list: ListWithCategory;
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

  useEffect(() => {
    fetchBookmarks();
  }, [userId, page]);

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

  const displayedBookmarks = showAll ? bookmarks : bookmarks.slice(0, 8);

  if (isLoading && bookmarks.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
            <div className="h-40 bg-gray-200" />
            <div className="p-3">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <p className="text-gray-500">هنوز لیستی ذخیره نکرده‌اید</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {displayedBookmarks.map((bookmark) => (
          <Link
            key={bookmark.id}
            href={`/lists/${bookmark.list.slug}`}
            className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="relative h-40 bg-gradient-to-br from-yellow-100 to-orange-100">
              <ImageWithFallback
                src={bookmark.list.coverImage ?? ''}
                alt={bookmark.list.title}
                className="w-full h-40 object-cover"
                fallbackIcon={bookmark.list.categories.icon}
                fallbackClassName="w-full h-full"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-sm">{bookmark.list.categories.icon}</span>
                <span className="text-xs text-gray-500 truncate">{bookmark.list.categories.name}</span>
              </div>
              <h3 className="font-bold text-sm line-clamp-2 leading-tight">{bookmark.list.title}</h3>
            </div>
          </Link>
        ))}
      </div>

      {!showAll && bookmarks.length > 8 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          مشاهده بیشتر ({bookmarks.length - 8} مورد دیگر)
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
          className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
        </button>
      )}
    </div>
  );
}

