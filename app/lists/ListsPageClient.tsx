'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { lists, categories } from '@prisma/client';
import FloatingActionButton from '@/components/mobile/lists/FloatingActionButton';
import SuggestModal from '@/components/mobile/lists/SuggestModal';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';

type ListWithCategory = lists & {
  categories: categories;
  saveCount?: number;
  itemCount?: number;
  likeCount?: number;
  viewCount?: number;
  _count: {
    items: number;
    list_likes: number;
  };
};

interface ListsPageClientProps {
  lists: ListWithCategory[];
  categories: categories[];
}

type SortOption = 'newest' | 'popular' | 'mostViewed' | 'alphabetical';

export default function ListsPageClient({ lists, categories }: ListsPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedCategory = localStorage.getItem('listsPage_category');
    const savedSort = localStorage.getItem('listsPage_sort');
    
    if (savedCategory) setSelectedCategory(savedCategory);
    if (savedSort) setSortBy(savedSort as SortOption);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('listsPage_category', selectedCategory);
    localStorage.setItem('listsPage_sort', sortBy);
  }, [selectedCategory, sortBy]);

  // Filter lists
  const filteredLists = lists.filter((list) => {
    const categoryMatch = selectedCategory === 'all' || list.categoryId === selectedCategory;
    const searchMatch = searchQuery === '' || 
      list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && searchMatch && list.isActive && list.isPublic;
  });

  // Sort lists
  const sortedLists = [...filteredLists].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return b.likeCount - a.likeCount;
      case 'mostViewed':
        return b.viewCount - a.viewCount;
      case 'alphabetical':
        return a.title.localeCompare(b.title, 'fa');
      default:
        return 0;
    }
  });

  const sortOptions = [
    { value: 'newest', label: '🆕 جدیدترین', icon: '🆕' },
    { value: 'popular', label: '❤️ محبوب‌ترین', icon: '❤️' },
    { value: 'mostViewed', label: '👁 پربازدیدترین', icon: '👁' },
    { value: 'alphabetical', label: '🔤 الفبایی', icon: '🔤' },
  ];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-gray-50 pt-4 pb-2 px-4 -mx-4">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو در لیست‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pr-12 bg-white rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Chips */}
      <div className="px-4 -mx-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-primary'
            }`}
          >
            همه ({lists.filter(l => l.isActive && l.isPublic).length})
          </button>
          {categories
            .filter(cat => cat.isActive)
            .sort((a, b) => a.order - b.order)
            .map((category) => {
              const count = lists.filter(
                (list) => list.categoryId === category.id && list.isActive && list.isPublic
              ).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                  style={
                    selectedCategory === category.id
                      ? { backgroundColor: category.color }
                      : {}
                  }
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                  <span className="text-xs opacity-75">({count})</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between px-4">
        <span className="text-sm text-gray-600 font-medium">
          {sortedLists.length} لیست
        </span>
        <div className="flex gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value as SortOption)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === option.value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'
              }`}
            >
              <span>{option.icon}</span>
              <span className="hidden sm:inline">{option.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lists Grid */}
      {sortedLists.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            لیستی یافت نشد
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? 'جستجوی دیگری امتحان کنید'
              : 'هنوز لیستی در این دسته‌بندی وجود ندارد'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {sortedLists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.slug}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Cover Image */}
              {list.coverImage ? (
                <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                  <img
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      // Replace with fallback on error
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'h-full w-full flex items-center justify-center fallback-icon';
                        fallback.innerHTML = `<span class="text-6xl">${list.categories.icon}</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  {/* Bookmark Button */}
                  <div className="absolute top-3 right-3 z-20">
                    <BookmarkButton
                      listId={list.id}
                      initialBookmarkCount={list.saveCount ?? list._count?.bookmarks ?? 0}
                      variant="icon"
                      size="md"
                    />
                  </div>
                  {list.isFeatured && (
                    <div className="absolute top-3 right-12 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                      ⭐ ویژه
                    </div>
                  )}
                  {list.badge && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold z-10">
                      {list.badge === 'TRENDING' && '🔥 ترند'}
                      {list.badge === 'NEW' && '🆕 جدید'}
                      {list.badge === 'FEATURED' && '⭐ برگزیده'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
                  <span className="text-6xl">{list.categories.icon}</span>
                  {/* Bookmark Button */}
                  <div className="absolute top-3 right-3 z-20">
                    <BookmarkButton
                      listId={list.id}
                      initialBookmarkCount={list.saveCount ?? list._count?.bookmarks ?? 0}
                      variant="icon"
                      size="md"
                    />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{list.categories.icon}</span>
                  <span className="text-xs text-gray-500 font-medium">
                    {list.categories.name}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                  {list.title}
                </h3>

                {/* Description */}
                {list.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {list.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <span>📋</span>
                    <span>{list._count.items}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>❤️</span>
                    <span>{list._count.list_likes}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>⭐</span>
                    <span>{list.saveCount ?? 0}</span>
                  </span>
                  <span className="flex items-center gap-1 mr-auto">
                    <span>👁</span>
                    <span>{list.viewCount}</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom Spacing for BottomNav */}
      <div className="h-8"></div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setIsSuggestModalOpen(true)} />

      {/* Suggest Modal */}
      <SuggestModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
      />
    </div>
  );
}

