'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Eye, EyeOff, Package, Heart, Bookmark, Flame, Eye as EyeIcon } from 'lucide-react';
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

type FilterType = 'all' | 'public' | 'private' | 'draft';

interface MyListsTabProps {
  userId: string;
}

const VIRAL_LIKE_THRESHOLD = 50;
const FEATURED_SAVE_THRESHOLD = 10;

export default function MyListsTab({ userId }: MyListsTabProps) {
  const [lists, setLists] = useState<ListWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedList, setSelectedList] = useState<ListWithCategory | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    fetchLists();
  }, [userId, page, filter]);

  const fetchLists = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter !== 'all') params.set('filter', filter);
      const response = await fetch(`/api/user/my-lists?${params}`);
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
    fetchLists();
  };

  const handleListDelete = () => {
    fetchLists();
  };

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'همه' },
    { id: 'public', label: 'عمومی' },
    { id: 'private', label: 'خصوصی' },
    { id: 'draft', label: 'پیش‌نویس' },
  ];

  const renderListCard = (list: ListWithCategory, size: 'normal' | 'featured') => {
    const likes = list.likeCount ?? list._count?.list_likes ?? 0;
    const items = list.itemCount ?? list._count?.items ?? 0;
    const saves = list.saveCount ?? list._count?.bookmarks ?? 0;
    const views = list.viewCount ?? 0;
    const isViral = likes >= VIRAL_LIKE_THRESHOLD;
    const isPopular = saves >= FEATURED_SAVE_THRESHOLD;
    const badge = list.badge?.toString().toLowerCase() ?? null;
    const isFeatured = list.isFeatured || badge === 'featured' || badge === 'trending';

    const cardHeight = size === 'featured' ? 'h-56' : 'h-44';
    const titleSize = size === 'featured' ? 'text-xl' : 'text-lg';

    return (
      <div key={list.id} className="group">
        <Link href={`/user-lists/${list.id}`} className="block">
          <div
            className={`bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden border border-gray-100/80 ${size === 'featured' ? 'ring-1 ring-[#7C3AED]/20' : ''}`}
          >
            <div className={`relative ${cardHeight} overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200`}>
              <ImageWithFallback
                src={list.coverImage ?? ''}
                alt={list.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                fallbackIcon={list.categories?.icon}
                fallbackClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 justify-end">
                {list.categories && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs rounded-lg font-medium">
                    {list.categories.icon}
                    <span className="hidden sm:inline">{list.categories.name}</span>
                  </span>
                )}
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
                className="absolute top-3 left-3 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg text-gray-700 hover:bg-[#7C3AED] hover:text-white"
                aria-label="تنظیمات لیست"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 right-3 left-3">
                <h3 className={`text-white font-bold ${titleSize} line-clamp-2 drop-shadow-lg`}>{list.title}</h3>
              </div>
              {isViral && (
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-xs rounded-lg font-medium animate-pulse">
                    <Flame className="w-3.5 h-3.5" />
                    وایرال
                  </span>
                </div>
              )}
            </div>
            <div className="p-3.5">
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <EyeIcon className="w-3.5 h-3.5" />
                  {views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views}
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <Heart className="w-3.5 h-3.5" />
                  {likes}
                </span>
                <span className="flex items-center gap-1 text-[#7C3AED]">
                  <Bookmark className="w-3.5 h-3.5" />
                  {saves}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Package className="w-3.5 h-3.5" />
                  {items} آیتم
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {isViral && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">🔥 وایرال</span>
                )}
                {isFeatured && (
                  <span className="px-2 py-0.5 bg-[#7C3AED]/15 text-[#7C3AED] rounded-lg text-xs font-medium">⭐ منتخب</span>
                )}
                {badge === 'trending' && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium">📈 ترند</span>
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
      <div className="px-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-16 bg-gray-200 rounded-xl animate-pulse shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
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
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f.id ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">{emptyMessage}</p>
          {filter !== 'draft' && (
            <Link
              href="/lists/new"
              className="mt-4 inline-block px-6 py-2.5 bg-[#7C3AED] text-white rounded-2xl hover:bg-[#6D28D9] transition-colors font-medium text-sm"
            >
              ایجاد لیست جدید
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filter === f.id ? 'bg-[#7C3AED] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {lists.map((list, index) => (
            <div key={list.id} className={index % 4 === 0 ? 'col-span-2' : ''}>
              {renderListCard(list, index % 4 === 0 ? 'featured' : 'normal')}
            </div>
          ))}
        </div>
      </div>

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading}
          className="mx-4 mt-6 w-[calc(100%-2rem)] py-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
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
          onDelete={handleListDelete}
        />
      )}
    </>
  );
}
