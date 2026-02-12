'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { lists, categories } from '@prisma/client';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

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

type SortOption = 'trending' | 'newest' | 'popular';
type VibeFilter = 'all' | 'trending' | 'saved' | 'sleep' | 'calm_movie' | 'cafe';

const SORT_LABELS: Record<SortOption, string> = {
  trending: 'ترند',
  newest: 'جدید',
  popular: 'محبوب',
};

const VIBE_CHIPS: { value: VibeFilter; label: string }[] = [
  { value: 'trending', label: '🔥 ترند' },
  { value: 'saved', label: '⭐ ذخیره‌شده' },
  { value: 'sleep', label: '😴 قبل خواب' },
  { value: 'calm_movie', label: '🎬 فیلم آرامش‌بخش' },
  { value: 'cafe', label: '☕ کافه دنج' },
];

function matchVibe(list: ListWithCategory, vibe: VibeFilter, bookmarkedIds: Set<string>): boolean {
  if (vibe === 'all') return true;
  const title = (list.title || '').toLowerCase();
  const desc = (list.description || '').toLowerCase();
  const text = `${title} ${desc}`;
  switch (vibe) {
    case 'trending':
      return list.badge === 'TRENDING';
    case 'saved':
      return bookmarkedIds.has(list.id);
    case 'sleep':
      return /خواب|آرامش/.test(text);
    case 'calm_movie':
      return /فیلم/.test(text) && /آرامش|دنج/.test(text);
    case 'cafe':
      return /کافه|قهوه/.test(text);
    default:
      return true;
  }
}

export default function ListsPageClient({ lists: initialLists, categories }: ListsPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVibe, setSelectedVibe] = useState<VibeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const publicLists = initialLists.filter((l) => l.isActive && l.isPublic);

  useEffect(() => {
    const savedCategory = localStorage.getItem('listsPage_category');
    const savedSort = localStorage.getItem('listsPage_sort');
    if (savedCategory) setSelectedCategory(savedCategory);
    if (savedSort && (savedSort === 'trending' || savedSort === 'newest' || savedSort === 'popular'))
      setSortBy(savedSort as SortOption);
  }, []);

  useEffect(() => {
    localStorage.setItem('listsPage_category', selectedCategory);
    localStorage.setItem('listsPage_sort', sortBy);
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    fetch('/api/user/bookmarks?limit=500')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data?.bookmarks)) {
          const ids = new Set<string>(
            data.data.bookmarks
              .map((b: { list?: { id: string } }) => b.list?.id)
              .filter((id: string | undefined): id is string => Boolean(id))
          );
          setBookmarkedIds(ids);
        }
      })
      .catch(() => {});
  }, []);

  const filteredLists = publicLists.filter((list) => {
    const categoryMatch =
      selectedCategory === 'all' || list.categoryId === selectedCategory;
    const searchMatch =
      searchQuery === '' ||
      list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (list.description?.toLowerCase() ?? '').includes(searchQuery.toLowerCase());
    const vibeMatch = matchVibe(list, selectedVibe, bookmarkedIds);
    return categoryMatch && searchMatch && vibeMatch;
  });

  const sortedLists = [...filteredLists].sort((a, b) => {
    switch (sortBy) {
      case 'trending':
        return (b.saveCount ?? 0) - (a.saveCount ?? 0);
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return (b.likeCount ?? b._count?.list_likes ?? 0) - (a.likeCount ?? a._count?.list_likes ?? 0);
      default:
        return 0;
    }
  });

  const totalCount = publicLists.length;
  const hasFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedVibe !== 'all';
  const activeCategories = categories.filter((c) => c.isActive).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="px-4 space-y-1">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو در لیست‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pr-11 bg-white rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-gray-400 text-xs">می‌تونی بین همه لیست‌ها بگردی</p>
      </div>

      {/* Category chips */}
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            همه ({totalCount})
          </button>
          {activeCategories.map((cat) => {
            const count = publicLists.filter((l) => l.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Vibe chips */}
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {VIBE_CHIPS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedVibe(selectedVibe === value ? 'all' : value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedVibe === value ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + CTA */}
      <div className="flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setSortSheetOpen(true)}
          className="text-sm text-gray-600 font-medium"
        >
          مرتب‌سازی: {SORT_LABELS[sortBy]}
        </button>
        <Link
          href="/user-lists"
          className="text-sm text-primary font-medium hover:underline"
        >
          ساخت لیست جدید
        </Link>
      </div>

      {/* List cards */}
      {publicLists.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">هنوز لیستی اینجا نیست</h3>
          <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
            می‌تونی از صفحه خانه چند وایب ذخیره کنی یا اولین لیستت رو خودت بسازی.
          </p>
          <Link
            href="/user-lists"
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            ساخت لیست جدید
          </Link>
        </div>
      ) : sortedLists.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">چیزی با این فیلتر پیدا نشد</h3>
          <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
            می‌تونی فیلتر رو عوض کنی، یا همین موضوع رو خودت به یک لیست تبدیل کنی 😉
          </p>
          <Link
            href="/user-lists"
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            ساخت لیست با همین موضوع
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-4 pb-8">
          {sortedLists.map((list) => {
            const itemCount = list.itemCount ?? list._count?.items ?? 0;
            const saveCount = list.saveCount ?? 0;
            return (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100"
              >
                <div className="relative h-44 bg-gray-200 overflow-hidden rounded-t-2xl">
                  <ImageWithFallback
                    src={list.coverImage ?? ''}
                    alt={list.title}
                    className="w-full h-full object-cover"
                    fallbackIcon={list.categories?.icon ?? '📋'}
                    fallbackClassName="w-full h-full flex items-center justify-center text-5xl"
                  />
                  <div className="absolute top-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
                    <BookmarkButton
                      listId={list.id}
                      initialBookmarkCount={saveCount}
                      variant="icon"
                      size="md"
                    />
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    {list.categories?.icon} {list.categories?.name}
                  </p>
                  <h3 className="font-bold text-gray-900 line-clamp-2">{list.title}</h3>
                  {list.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{list.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    ⭐ {saveCount} &nbsp; • &nbsp; {itemCount} آیتم
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <BottomSheet
        isOpen={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        title="مرتب‌سازی"
        maxHeight="40vh"
      >
        <div className="flex flex-col py-2">
          {(['trending', 'newest', 'popular'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setSortBy(opt);
                setSortSheetOpen(false);
              }}
              className={`text-right py-4 px-4 rounded-xl font-medium transition-colors ${
                sortBy === opt ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'
              }`}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
