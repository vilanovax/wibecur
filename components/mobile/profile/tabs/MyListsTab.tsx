'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { categories, lists } from '@prisma/client';
import PersonalListSettingsModal from '../PersonalListSettingsModal';

type ListWithCategory = lists & {
  categories: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color'> | null;
  _count: {
    items: number;
    list_likes: number;
    bookmarks: number;
  };
};

interface MyListsTabProps {
  userId: string;
}

export default function MyListsTab({ userId }: MyListsTabProps) {
  const [lists, setLists] = useState<ListWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedList, setSelectedList] = useState<ListWithCategory | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchLists();
  }, [userId, page]);

  const fetchLists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/my-lists?page=${page}&limit=20`);
      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setLists(data.data.lists);
        } else {
          setLists((prev) => [...prev, ...data.data.lists]);
        }
        setHasMore(data.data.pagination.page < data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setIsLoading(false);
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
    fetchLists(); // Refresh lists after any update
  };

  const handleListDelete = () => {
    fetchLists(); // Refresh lists after deletion
  };

  // Separate public and private lists
  const publicLists = lists.filter(list => list.isPublic);
  const privateLists = lists.filter(list => !list.isPublic);

  // For display, show max 4 of each type initially
  const displayedPublicLists = showAll ? publicLists : publicLists.slice(0, 4);
  const displayedPrivateLists = showAll ? privateLists : privateLists.slice(0, 4);

  const renderListCard = (list: ListWithCategory) => (
    <div
      key={list.id}
      className={`relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
        list.isPublic 
          ? 'bg-gradient-to-br from-green-50 to-white border-2 border-green-200' 
          : 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200'
      }`}
    >
      {/* Settings Button */}
      <button
        onClick={(e) => handleSettingsClick(e, list)}
        className="absolute top-3 left-3 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
        aria-label="تنظیمات لیست"
      >
        <Settings className="w-5 h-5 text-gray-700" />
      </button>

      {/* Public/Private Badge */}
      <div className="absolute top-3 right-3 z-10">
        {list.isPublic ? (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-md">
            <Eye className="w-3.5 h-3.5" />
            عمومی
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-full text-xs font-bold shadow-md">
            <EyeOff className="w-3.5 h-3.5" />
            خصوصی
          </span>
        )}
      </div>

      <Link href={`/user-lists/${list.id}`} className="block">
        {list.coverImage && (
          <div className="relative h-48">
            <Image
              src={list.coverImage}
              alt={list.title}
              fill
              className="object-cover"
              unoptimized={true}
            />
            {/* Overlay for better text readability */}
            {!list.coverImage && (
              <div className={`absolute inset-0 ${list.isPublic ? 'bg-green-100' : 'bg-gray-200'}`} />
            )}
          </div>
        )}
        {!list.coverImage && (
          <div className={`h-32 ${list.isPublic ? 'bg-green-100' : 'bg-gray-200'}`} />
        )}
        <div className="p-4">
          {list.categories && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{list.categories.icon}</span>
              <span className="text-xs text-gray-500">{list.categories.name}</span>
            </div>
          )}
          <h3 className={`font-bold text-lg mb-2 ${list.isPublic ? 'text-green-900' : 'text-gray-900'}`}>
            {list.title}
          </h3>
          {list.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {list.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>📋 {list._count.items} آیتم</span>
            <span>❤️ {list._count.list_likes} لایک</span>
            <span>⭐ {list._count.bookmarks} ذخیره</span>
          </div>
        </div>
      </Link>
    </div>
  );

  if (isLoading && lists.length === 0) {
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

  if (lists.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <p className="text-gray-500">هنوز لیستی ایجاد نکرده‌اید</p>
        <Link
          href="/lists/new"
          className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          ایجاد لیست جدید
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Public Lists Section */}
        {publicLists.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
                <Eye className="w-5 h-5 text-green-700" />
                <h2 className="font-bold text-lg text-green-900">
                  لیست‌های عمومی ({publicLists.length})
                </h2>
              </div>
              <div className="flex-1 h-0.5 bg-green-200"></div>
            </div>
            
            <div className="space-y-4">
              {displayedPublicLists.map(renderListCard)}
            </div>

            {!showAll && publicLists.length > 4 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium border border-green-200"
              >
                مشاهده بیشتر ({publicLists.length - 4} مورد دیگر)
              </button>
            )}
          </div>
        )}

        {/* Divider */}
        {publicLists.length > 0 && privateLists.length > 0 && (
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-500 font-medium">یا</span>
            </div>
          </div>
        )}

        {/* Private Lists Section */}
        {privateLists.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <EyeOff className="w-5 h-5 text-gray-700" />
                <h2 className="font-bold text-lg text-gray-900">
                  لیست‌های خصوصی ({privateLists.length})
                </h2>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200"></div>
            </div>
            
            <div className="space-y-4">
              {displayedPrivateLists.map(renderListCard)}
            </div>

            {!showAll && privateLists.length > 4 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium border border-gray-200"
              >
                مشاهده بیشتر ({privateLists.length - 4} مورد دیگر)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Show More Button for All Lists */}
      {showAll && hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
          className="w-full mt-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? 'در حال بارگذاری...' : 'مشاهده بیشتر'}
        </button>
      )}

      {/* Settings Modal */}
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
        onDelete={handleListDelete}
      />
    )}
    </>
  );
}

