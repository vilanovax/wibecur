'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Grid, List as ListIcon, ArrowLeft, Plus } from 'lucide-react';
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

const CHIP_BASE =
  'flex items-center gap-1.5 h-9 px-3.5 rounded-lg wibe-small font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-[0.98]';

function categoryChipClass(isSelected: boolean) {
  return isSelected
    ? `${CHIP_BASE} bg-primary text-white shadow-sm`
    : `${CHIP_BASE} bg-wibe-card border border-wibe text-foreground shadow-sm hover:border-primary/30`;
}

const SELECT_CLASS =
  'px-3 py-2 rounded-md border border-wibe bg-wibe-surface wibe-small text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

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

  const filteredLists = useMemo(() => {
    if (selectedCategory === 'all') {
      return lists;
    }
    return lists.filter((list) => list.categoryId === selectedCategory);
  }, [lists, selectedCategory]);

  useEffect(() => {
    if (selectedList !== 'all' && !filteredLists.find((l) => l.id === selectedList)) {
      setSelectedList('all');
    }
  }, [filteredLists, selectedList]);

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

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطا در افزودن آیتم';
      setToastMessage(message);
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="min-h-screen bg-wibe-surface">
      <div className="bg-wibe-card border-b border-wibe sticky top-16 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href={`/user-lists/${listId}`}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="بازگشت به لیست"
            >
              <ArrowLeft className="w-5 h-5 text-wibe-secondary" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="wibe-h3 truncate">افزودن آیتم به {listTitle}</h1>
              <p className="wibe-caption text-wibe-secondary mt-0.5">
                {initialItems.length.toLocaleString('fa-IR')} آیتم در دسترس
              </p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wibe-secondary pointer-events-none" />
            <input
              type="text"
              placeholder="جستجوی آیتم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-10 py-2.5 rounded-md border border-wibe bg-wibe-surface wibe-small focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="پاک کردن جستجو"
              >
                <X className="w-4 h-4 text-wibe-secondary" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={categoryChipClass(selectedCategory === 'all')}
            >
              همه ({initialItems.length.toLocaleString('fa-IR')})
            </button>
            {categories.map((category) => {
              const count = initialItems.filter(
                (item) => item.lists.categoryId === category.id
              ).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={categoryChipClass(selectedCategory === category.id)}
                >
                  <span aria-hidden>{category.icon}</span>
                  <span>
                    {category.name} ({count.toLocaleString('fa-IR')})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              className={`flex-1 min-w-0 ${SELECT_CLASS}`}
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
              className={SELECT_CLASS}
            >
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="title-asc">عنوان (صعودی)</option>
              <option value="title-desc">عنوان (نزولی)</option>
            </select>

            <div className="flex rounded-md border border-wibe p-0.5 bg-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="نمایش گریدی"
                aria-pressed={viewMode === 'grid'}
                className={`p-2 rounded-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-wibe-card shadow-sm text-primary'
                    : 'text-wibe-secondary'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="نمایش لیستی"
                aria-pressed={viewMode === 'list'}
                className={`p-2 rounded-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-wibe-card shadow-sm text-primary'
                    : 'text-wibe-secondary'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-8">
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 bg-wibe-card rounded-lg border border-wibe">
            <div className="text-5xl mb-3" aria-hidden>
              🔍
            </div>
            <p className="wibe-body text-wibe-secondary">آیتمی یافت نشد</p>
            <p className="wibe-caption text-wibe-secondary mt-1">
              فیلتر یا عبارت جستجو را تغییر دهید
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 gap-3'
                : 'space-y-3'
            }
          >
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className={`bg-wibe-card rounded-lg overflow-hidden border border-wibe shadow-sm active:scale-[0.99] transition-transform ${
                  viewMode === 'list' ? 'flex gap-3' : ''
                }`}
              >
                <div
                  className={`relative bg-gray-200 ${
                    viewMode === 'grid' ? 'h-36' : 'w-24 h-24 flex-shrink-0'
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
                <div className={`p-3 ${viewMode === 'list' ? 'flex-1 min-w-0' : ''}`}>
                  <div className="mb-2">
                    <h3 className="wibe-small font-semibold line-clamp-2 text-foreground">
                      {item.title}
                    </h3>
                    {item.lists.categories && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm" aria-hidden>
                          {item.lists.categories.icon}
                        </span>
                        <span className="wibe-caption text-wibe-secondary">
                          {item.lists.categories.name}
                        </span>
                      </div>
                    )}
                    <p className="wibe-caption text-wibe-secondary line-clamp-1 mt-0.5">
                      از: {item.lists.title}
                    </p>
                  </div>
                  {item.description && viewMode === 'list' && (
                    <p className="wibe-caption text-wibe-secondary mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddItem(item.id)}
                    disabled={isAdding === item.id}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-white wibe-small font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding === item.id ? (
                      'در حال افزودن...'
                    ) : (
                      <>
                        <Plus className="w-4 h-4" aria-hidden />
                        افزودن
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
