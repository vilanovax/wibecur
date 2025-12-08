'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, Grid, List as ListIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Toast from '@/components/shared/Toast';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface List {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  categories: Category | null;
  createdAt: string;
  updatedAt: string;
}

interface Item {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  listId: string;
  createdAt: string;
  lists: {
    id: string;
    title: string;
    slug: string;
    categoryId: string | null;
    categories: Category | null;
  };
}

interface AddItemClientProps {
  listId: string;
  listTitle: string;
  items: Item[];
  categories: Category[];
  lists: List[];
}

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export default function AddItemClient({
  listId,
  listTitle,
  items: initialItems,
  categories,
  lists,
}: AddItemClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedList, setSelectedList] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Filter lists based on selected category
  const filteredLists = useMemo(() => {
    if (selectedCategory === 'all') {
      return lists;
    }
    return lists.filter((list) => list.categoryId === selectedCategory);
  }, [lists, selectedCategory]);

  // Reset selectedList if it's not in filtered lists when category changes
  useEffect(() => {
    if (selectedList !== 'all' && !filteredLists.find((l) => l.id === selectedList)) {
      setSelectedList('all');
    }
  }, [filteredLists, selectedList]);

  // Filter items
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const categoryMatch =
        selectedCategory === 'all' ||
        item.lists.categoryId === selectedCategory;
      const listMatch =
        selectedList === 'all' || item.listId === selectedList;
      const searchMatch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lists.title.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && listMatch && searchMatch;
    });
  }, [initialItems, selectedCategory, selectedList, searchQuery]);

  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'title-asc':
          return a.title.localeCompare(b.title, 'fa');
        case 'title-desc':
          return b.title.localeCompare(a.title, 'fa');
        default:
          return 0;
      }
    });
  }, [filteredItems, sortBy]);

  const handleAddItem = async (itemId: string) => {
    setIsAdding(itemId);
    try {
      const res = await fetch(`/api/user/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          order: 0,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در افزودن آیتم');
      }

      setToastMessage('آیتم با موفقیت به لیست اضافه شد');
      setToastType('success');
      setShowToast(true);

      // Remove item from view after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'خطا در افزودن آیتم');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href={`/user-lists/${listId}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                افزودن آیتم به {listTitle}
              </h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجوی آیتم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Category Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              همه ({initialItems.length})
            </button>
            {categories.map((category) => {
              const count = initialItems.filter(
                (item) => item.lists.categoryId === category.id
              ).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>
                    {category.name} ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* List Dropdown and Sort */}
          <div className="flex gap-2">
            <select
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="all">
                {selectedCategory === 'all'
                  ? 'همه لیست‌ها'
                  : `همه لیست‌های ${categories.find((c) => c.id === selectedCategory)?.name || 'انتخاب شده'}`}
              </option>
              {filteredLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="title-asc">عنوان (صعودی)</option>
              <option value="title-desc">عنوان (نزولی)</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } transition-colors`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 border-r border-gray-300 ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } transition-colors`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid/List */}
      <div className="p-4">
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-600">آیتمی یافت نشد</p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 gap-4'
                : 'space-y-3'
            }
          >
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
                  viewMode === 'list' ? 'flex gap-4' : ''
                }`}
              >
                <div
                  className={`relative bg-gray-100 ${
                    viewMode === 'grid' ? 'h-40' : 'w-24 h-24 flex-shrink-0'
                  }`}
                >
                  <ImageWithFallback
                    src={item.imageUrl || ''}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    fallbackIcon="📋"
                    fallbackClassName="w-full h-full"
                  />
                </div>
                <div className={`p-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      {item.lists.categories && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs">
                            {item.lists.categories.icon}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.lists.categories.name}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 line-clamp-1">
                        از: {item.lists.title}
                      </p>
                    </div>
                  </div>
                  {item.description && viewMode === 'list' && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <button
                    onClick={() => handleAddItem(item.id)}
                    disabled={isAdding === item.id}
                    className="w-full px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding === item.id ? 'در حال افزودن...' : '➕ افزودن'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

