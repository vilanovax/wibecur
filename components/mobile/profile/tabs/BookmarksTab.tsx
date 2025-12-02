'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

  const displayedBookmarks = showAll ? bookmarks : bookmarks.slice(0, 4);

  if (isLoading && bookmarks.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
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
    <div className="space-y-4">
      {displayedBookmarks.map((bookmark) => (
        <Link
          key={bookmark.id}
          href={`/lists/${bookmark.list.slug}`}
          className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
          {bookmark.list.coverImage && (
            <div className="relative h-48">
              <Image
                src={bookmark.list.coverImage}
                alt={bookmark.list.title}
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{bookmark.list.categories.icon}</span>
              <span className="text-xs text-gray-500">
                {bookmark.list.categories.name}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-2">{bookmark.list.title}</h3>
            {bookmark.list.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {bookmark.list.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>📋 {bookmark.list._count.items} آیتم</span>
              <span>❤️ {bookmark.list._count.list_likes} لایک</span>
              <span>⭐ {bookmark.list._count.bookmarks} ذخیره</span>
            </div>
          </div>
        </Link>
      ))}

      {!showAll && bookmarks.length > 4 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          مشاهده بیشتر ({bookmarks.length - 4} مورد دیگر)
        </button>
      )}
      
      {showAll && hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? 'در حال بارگذاری...' : 'مشاهده بیشتر'}
        </button>
      )}
    </div>
  );
}

