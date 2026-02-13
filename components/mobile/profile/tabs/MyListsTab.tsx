'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Eye, EyeOff, Package, Heart, Flame, Eye as EyeIcon } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
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
  /** وقتی از تب جدا استفاده می‌شود: فقط عمومی، فقط خصوصی، یا هر دو */
  variant?: 'all' | 'public' | 'private';
}

const VIRAL_LIKE_THRESHOLD = 50;

export default function MyListsTab({ userId, variant = 'all' }: MyListsTabProps) {
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

  const publicLists = lists.filter((list) => list.isPublic);
  const privateLists = lists.filter((list) => !list.isPublic);
  const displayedLists =
    variant === 'public'
      ? publicLists
      : variant === 'private'
        ? privateLists
        : [...publicLists, ...privateLists];
  const displayedPublicLists = showAll ? publicLists : publicLists.slice(0, 4);
  const displayedPrivateLists = showAll ? privateLists : privateLists.slice(0, 4);

  const renderListCard = (list: ListWithCategory) => {
    const likes = list.likeCount ?? list._count?.list_likes ?? 0;
    const items = list.itemCount ?? list._count?.items ?? 0;
    const saves = list.saveCount ?? list._count?.bookmarks ?? 0;
    const views = list.viewCount ?? 0;
    const isViral = likes >= VIRAL_LIKE_THRESHOLD;
    return (
      <div key={list.id} className="group">
        <Link href={`/user-lists/${list.id}`} className="block">
          <div className="bg-white rounded-[20px] shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              <ImageWithFallback
                src={list.coverImage ?? ''}
                alt={list.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                fallbackIcon={list.categories?.icon}
                fallbackClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute top-3 right-3 flex gap-2">
                {list.isPublic ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                    <Eye className="w-3 h-3" />
                    عمومی
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-700/90 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                    <EyeOff className="w-3 h-3" />
                    خصوصی
                  </span>
                )}
              </div>
              <button
                onClick={(e) => handleSettingsClick(e, list)}
                className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                aria-label="تنظیمات لیست"
              >
                <Settings className="w-4 h-4 text-gray-700" />
              </button>
              <div className="absolute bottom-3 right-3 left-3">
                <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
                  {list.title}
                </h3>
              </div>
            </div>
            <div className="p-4">
              {list.categories && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{list.categories.icon}</span>
                  <span className="text-sm text-gray-600">{list.categories.name}</span>
                </div>
              )}
              {list.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                  {list.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {items} آیتم
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <Heart className="w-3.5 h-3.5" />
                  {likes}
                </span>
                {isViral && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <Flame className="w-3.5 h-3.5" />
                    وایرال
                  </span>
                )}
                {views > 0 && (
                  <span className="flex items-center gap-1">
                    <EyeIcon className="w-3.5 h-3.5" />
                    {views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

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

  const emptyMessage =
    variant === 'private'
      ? 'لیست خصوصی ندارید'
      : variant === 'public'
        ? 'لیست عمومی ندارید'
        : 'هنوز لیستی ایجاد نکرده‌اید';

  if (displayedLists.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-500">{emptyMessage}</p>
        {variant !== 'private' && (
          <Link
            href="/lists/new"
            className="mt-4 inline-block px-6 py-2.5 bg-[#7C3AED] text-white rounded-[20px] hover:bg-[#6D28D9] transition-colors font-medium text-sm"
          >
            ایجاد لیست جدید
          </Link>
        )}
      </div>
    );
  }

  const listToShow =
    variant === 'public'
      ? displayedPublicLists
      : variant === 'private'
        ? displayedPrivateLists
        : [...displayedPublicLists, ...displayedPrivateLists];
  const hasMorePublic = !showAll && publicLists.length > 4;
  const hasMorePrivate = !showAll && privateLists.length > 4;

  return (
    <>
      <div className="space-y-6 px-4">
        {variant === 'all' && (publicLists.length > 0 || privateLists.length > 0) && (
          <>
            {publicLists.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-600" />
                  <h2 className="font-semibold text-sm text-gray-700">لیست‌های عمومی</h2>
                  <span className="text-xs text-gray-400">({publicLists.length})</span>
                </div>
                <div className="space-y-4">{displayedPublicLists.map(renderListCard)}</div>
                {hasMorePublic && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full py-2.5 bg-gray-50 text-gray-700 rounded-[20px] hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    مشاهده همه ({publicLists.length - 4} مورد دیگر)
                  </button>
                )}
              </div>
            )}
            {privateLists.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-gray-600" />
                  <h2 className="font-semibold text-sm text-gray-700">لیست‌های خصوصی</h2>
                  <span className="text-xs text-gray-400">({privateLists.length})</span>
                </div>
                <div className="space-y-4">{displayedPrivateLists.map(renderListCard)}</div>
                {hasMorePrivate && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full py-2.5 bg-gray-50 text-gray-700 rounded-[20px] hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    مشاهده همه ({privateLists.length - 4} مورد دیگر)
                  </button>
                )}
              </div>
            )}
          </>
        )}
        {variant !== 'all' && (
          <div className="space-y-4">{listToShow.map(renderListCard)}</div>
        )}
      </div>

      {/* Show More Button for All Lists */}
      {showAll && hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
          className="w-full mt-6 py-2.5 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
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

