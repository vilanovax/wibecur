'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { lists, categories } from '@prisma/client';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import FloatingActionButton from '@/components/mobile/lists/FloatingActionButton';
import CreateListForm from '@/components/mobile/user-lists/CreateListForm';

type ListWithRelations = Omit<lists, 'createdAt' | 'updatedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  categories: categories | null;
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  saveCount?: number;
  itemCount?: number;
  likeCount?: number;
  viewCount?: number;
  _count: {
    items: number;
    list_likes: number;
    bookmarks: number;
  };
};

interface UserListsPageClientProps {
  initialLists: ListWithRelations[];
  categories: categories[];
}

type SortOption = 'newest' | 'popular' | 'mostViewed';

export default function UserListsPageClient({
  initialLists,
  categories,
}: UserListsPageClientProps) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  // Remove duplicates from initialLists by ID (memoized to prevent useEffect infinite loop)
  const uniqueInitialLists = useMemo(
    () =>
      initialLists.filter(
        (list, index, self) => index === self.findIndex((l) => l.id === list.id)
      ),
    [initialLists]
  );
  const [lists, setLists] = useState<ListWithRelations[]>(uniqueInitialLists);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [hasMore, setHasMore] = useState(initialLists.length >= 20); // Assume more if we got 20 items
  const [currentPage, setCurrentPage] = useState(1);
  const isLoadingRef = useRef(false);

  // Open create form when coming from Create Sheet with ?openCreate=1
  useEffect(() => {
    if (searchParams.get('openCreate') === '1') {
      setIsCreateFormOpen(true);
      // Clear query from URL so refresh doesn't reopen
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/user-lists');
      }
    }
  }, [searchParams]);

  // Filter lists
  const filteredLists = lists.filter((list) => {
    const categoryMatch =
      selectedCategory === 'all' || list.categoryId === selectedCategory;
    const searchMatch =
      searchQuery === '' ||
      list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Sort lists
  const sortedLists = [...filteredLists].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return (b.likeCount || b._count.list_likes) - (a.likeCount || a._count.list_likes);
      case 'mostViewed':
        return (b.viewCount || 0) - (a.viewCount || 0);
      default:
        return 0;
    }
  });

  const fetchFilteredLists = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        sort: sortBy,
      });
      if (selectedCategory !== 'all') {
        params.set('categoryId', selectedCategory);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/lists/user-created?${params}`);
      const data = await response.json();

      if (data.success) {
        setLists(data.data || []);
        setCurrentPage(1);
        // Check if there are more pages
        if (data.pagination) {
          setHasMore(data.pagination.page < data.pagination.totalPages);
        } else {
          // Fallback: if no pagination info, assume more if we got 20 items
          setHasMore((data.data || []).length >= 20);
        }
      }
    } catch (error) {
      console.error('Error fetching filtered lists:', error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // Debounced search effect
  useEffect(() => {
    // Skip on initial mount to avoid unnecessary API call
    const isInitialMount = selectedCategory === 'all' && !searchQuery && sortBy === 'newest';
    if (isInitialMount) {
      return;
    }

    // Only refetch if filters are different from initial
    if (selectedCategory !== 'all' || searchQuery) {
      const timeoutId = setTimeout(() => {
        fetchFilteredLists();
      }, searchQuery ? 500 : 0); // Debounce search queries

      return () => clearTimeout(timeoutId);
    } else {
      // Reset to initial lists if filters are cleared
      setLists(uniqueInitialLists);
      setCurrentPage(1);
      setHasMore(uniqueInitialLists.length >= 20);
    }
  }, [selectedCategory, searchQuery, sortBy, fetchFilteredLists, uniqueInitialLists]);

  const loadMoreLists = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || isLoading) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: '20',
        sort: sortBy,
      });
      if (selectedCategory !== 'all') {
        params.set('categoryId', selectedCategory);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/lists/user-created?${params}`);
      const data = await response.json();

      if (data.success) {
        if (data.data.length > 0) {
          setLists((prev) => {
            // Remove duplicates by ID
            const existingIds = new Set(prev.map((list) => list.id));
            const newLists = data.data.filter(
              (list: ListWithRelations) => !existingIds.has(list.id)
            );
            return [...prev, ...newLists];
          });
          setCurrentPage(nextPage);
          setHasMore(
            data.pagination && data.pagination.page < data.pagination.totalPages
          );
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading more lists:', error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [currentPage, hasMore, isLoading, selectedCategory, searchQuery, sortBy]);

  // Fetch more lists when scrolling
  useEffect(() => {
    if (!hasMore) return; // Don't add listener if no more to load

    const handleScroll = () => {
      // Check if we're near the bottom of the page
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition >= documentHeight - 500 && !isLoadingRef.current && hasMore) {
        loadMoreLists();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadMoreLists]);

  // Get category counts
  const categoryCounts = categories.map((category) => ({
    ...category,
    count: lists.filter((list) => list.categoryId === category.id).length,
  }));

  const sortOptions: { value: SortOption; label: string; icon: string }[] = [
    { value: 'newest', label: '🆕 جدیدترین', icon: '🆕' },
    { value: 'popular', label: '❤️ محبوب‌ترین', icon: '❤️' },
    { value: 'mostViewed', label: '👁 پربازدیدترین', icon: '👁' },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          لیست‌های کاربران
        </h1>
        <p className="text-gray-600 text-sm">
          لیست‌های عمومی که توسط کاربران ایجاد شده‌اند
        </p>
      </div>

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

      {/* Category Filters */}
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            همه ({lists.length})
          </button>
          {categoryCounts
            .filter((cat) => cat.count > 0)
            .map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
                style={
                  selectedCategory === category.id
                    ? { backgroundColor: category.color }
                    : {}
                }
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className="text-xs opacity-75 ml-1">({category.count})</span>
              </button>
            ))}
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
              onClick={() => setSortBy(option.value)}
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

      {/* Pinterest-style Masonry Grid */}
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
        <div className="px-4">
          <div
            className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
            style={{ columnGap: '1rem' }}
          >
            {sortedLists.map((list) => (
              <Link
                key={list.id}
                href={`/user-lists/${list.id}`}
                className="group block break-inside-avoid mb-4 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Cover Image */}
                {list.coverImage ? (
                  <div className="relative w-full h-48 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                    <img
                      src={list.coverImage}
                      alt={list.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-icon')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'h-full w-full flex items-center justify-center fallback-icon';
                          fallback.innerHTML = `<span class="text-6xl">${list.categories?.icon || '📋'}</span>`;
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
                  </div>
                ) : (
                  <div className="relative w-full h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
                    <span className="text-6xl">{list.categories?.icon || '📋'}</span>
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
                    {list.categories && (
                      <>
                        <span className="text-lg">{list.categories.icon}</span>
                        <span className="text-xs text-gray-500 font-medium">
                          {list.categories.name}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                    {list.title}
                  </h3>

                  {/* Description */}
                  {list.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {list.description}
                    </p>
                  )}

                  {/* Creator Info */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    {list.users.image ? (
                      <img
                        src={list.users.image}
                        alt={list.users.name || list.users.email}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs text-primary font-bold">
                          {(list.users.name || list.users.email)[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600">
                      {list.users.name || list.users.email.split('@')[0]}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>📦</span>
                      <span>{list.itemCount ?? list._count.items} آیتم</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>❤️</span>
                      <span>{list.likeCount ?? list._count.list_likes}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>🔖</span>
                      <span>{list.saveCount ?? list._count.bookmarks}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              در حال بارگذاری...
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => setIsCreateFormOpen(true)}
        label="ایجاد لیست شخصی"
      />

      {/* Create List Form */}
      <CreateListForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onSuccess={() => {
          // Refresh lists after creation
          window.location.reload();
        }}
      />
    </div>
  );
}

