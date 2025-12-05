'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Item, List, Category } from '@prisma/client';

type ItemWithRelations = Item & {
  lists: List & {
    categories: Category | null;
  };
};

type ListWithCategory = List & {
  categories: Category | null;
};

interface ItemsPageClientProps {
  items: ItemWithRelations[];
  lists: ListWithCategory[];
  initialListId?: string;
  itemCountsByList?: Record<string, number>;
}

export default function ItemsPageClient({
  items,
  lists,
  initialListId,
  itemCountsByList = {},
}: ItemsPageClientProps) {
  const router = useRouter();
  const [selectedListId, setSelectedListId] = useState<string>(
    initialListId || 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Get unique categories from lists (filter out lists without categories)
  const categories = Array.from(
    new Map(
      lists
        .filter((list) => list.categories !== null)
        .map((list) => [list.categories!.id, list.categories!])
    ).values()
  );

  // Filter items by category first, then by list
  const filteredItems = items.filter((item) => {
    // Skip items whose list doesn't have a category (personal lists)
    if (!item.lists.categories) {
      return false;
    }
    const categoryMatch =
      selectedCategory === 'all' ||
      item.lists.categories.id === selectedCategory;
    const listMatch =
      selectedListId === 'all' || item.listId === selectedListId;
    return categoryMatch && listMatch;
  });

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Reset list filter when changing category
    setSelectedListId('all');
  };

  const handleListFilterChange = (listId: string) => {
    setSelectedListId(listId);
    // No need to push to router - we filter client-side
    // This allows dropdown to always show all lists
  };

  // Get lists filtered by selected category
  const filteredLists =
    selectedCategory === 'all'
      ? lists
      : lists.filter((list) => list.categories?.id === selectedCategory);

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این آیتم اطمینان دارید؟')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      router.refresh();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('خطا در حذف آیتم');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedList = lists.find((l) => l.id === selectedListId);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">آیتم‌ها</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredItems.length} آیتم
            {selectedListId !== 'all' && ` از لیست "${selectedList?.title}"`}
          </p>
        </div>
        {selectedListId !== 'all' && (
          <Link
            href={`/admin/items/new?listId=${selectedListId}`}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            + آیتم جدید
          </Link>
        )}
      </div>

      {/* Category Filter (Chips) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          فیلتر بر اساس دسته‌بندی:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            همه دسته‌ها
            <span className="text-xs opacity-75">
              ({items.length})
            </span>
          </button>
          {categories.map((category) => {
            const count = items.filter(
              (item) => item.lists.categories?.id === category.id
            ).length;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

      {/* List Filter (Dropdown) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          فیلتر بر اساس لیست:
        </label>
        <select
          value={selectedListId}
          onChange={(e) => handleListFilterChange(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">
            {selectedCategory === 'all'
              ? `همه لیست‌ها (${items.length})`
              : `همه لیست‌های این دسته (${items.filter(item => 
                  selectedCategory === 'all' || item.lists.categories?.id === selectedCategory
                ).length})`}
          </option>
          {filteredLists.map((list) => {
            // Use item count from server if available, otherwise count from current items
            const totalCount = itemCountsByList[list.id] || 0;
            // If category filter is active, we need to count from items (limited to current page)
            // This is not perfect but better than showing wrong counts
            const visibleCount = selectedCategory === 'all' 
              ? totalCount
              : items.filter((item) => {
                  const categoryMatch = item.lists.categories?.id === selectedCategory;
                  const listMatch = item.listId === list.id;
                  return categoryMatch && listMatch;
                }).length;
            
            return (
              <option key={list.id} value={list.id}>
                {list.categories?.icon || '📋'} {list.title} ({selectedCategory === 'all' ? totalCount : visibleCount})
              </option>
            );
          })}
        </select>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500 mb-4">
            {selectedListId === 'all'
              ? 'هنوز آیتمی ایجاد نشده است'
              : 'این لیست هنوز آیتمی ندارد'}
          </p>
          {selectedListId !== 'all' && (
            <Link
              href={`/admin/items/new?listId=${selectedListId}`}
              className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              + افزودن اولین آیتم
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {item.imageUrl && (
                <div className="relative h-48">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
              )}
              <div className="p-4">
                {/* List & Category Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{item.lists.categories?.icon || '📋'}</span>
                  <span className="text-xs text-gray-500">
                    {item.lists.title}
                  </span>
                  <span className="text-xs text-gray-400">#{item.order}</span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>

                {/* Description */}
                {item.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Metadata */}
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
                    {item.lists.categories && renderMetadata(item.metadata, item.lists.categories.slug)}
                  </div>
                )}

                {/* External URL */}
                {item.externalUrl && (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline mb-3 block"
                  >
                    🔗 اطلاعات بیشتر
                  </a>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/admin/items/${item.id}/edit`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    ویرایش
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                  >
                    {deletingId === item.id ? '...' : 'حذف'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to render metadata based on category
function renderMetadata(metadata: any, categorySlug: string) {
  if (categorySlug === 'movie' || categorySlug === 'film' || categorySlug === 'movies') {
    return (
      <div className="space-y-1">
        {metadata.imdbRating && (
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <span className="text-yellow-500">⭐</span>
            <span className="font-semibold text-lg">{metadata.imdbRating}</span>
            <span className="text-xs text-gray-500">IMDb</span>
          </div>
        )}
        {metadata.year && (
          <div className="text-gray-700">
            📅 سال تولید: <span className="font-medium">{metadata.year}</span>
          </div>
        )}
        {metadata.genre && (
          <div className="text-gray-700">
            🎭 ژانر: <span className="font-medium">{metadata.genre}</span>
          </div>
        )}
        {metadata.director && (
          <div className="text-gray-700">
            🎬 کارگردان: <span className="font-medium">{metadata.director}</span>
          </div>
        )}
      </div>
    );
  }

  if (categorySlug === 'book' || categorySlug === 'books') {
    return (
      <div className="space-y-1">
        {metadata.author && (
          <div className="text-gray-700">
            ✍️ نویسنده: <span className="font-medium">{metadata.author}</span>
          </div>
        )}
        {metadata.genre && (
          <div className="text-gray-700">
            📚 ژانر: <span className="font-medium">{metadata.genre}</span>
          </div>
        )}
      </div>
    );
  }

  if (categorySlug === 'cafe' || categorySlug === 'restaurant') {
    return (
      <div className="space-y-1">
        {metadata.address && (
          <div className="text-gray-700">
            📍 آدرس: <span className="font-medium">{metadata.address}</span>
          </div>
        )}
        {metadata.priceRange && (
          <div className="text-gray-700">
            💰 قیمت: <span className="font-medium">{metadata.priceRange}</span>
          </div>
        )}
        {metadata.cuisine && (
          <div className="text-gray-700">
            🍽️ نوع غذا: <span className="font-medium">{metadata.cuisine}</span>
          </div>
        )}
      </div>
    );
  }

  // Default: show raw JSON
  return (
    <pre className="text-xs text-gray-600 overflow-auto">
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
}
