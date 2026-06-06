'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { items, lists, categories } from '@prisma/client';
import { FileJson, Link2 } from 'lucide-react';
import AdminItemCardImage from '@/components/admin/items/AdminItemCardImage';
import ExternalImageItemsModal from '@/components/admin/items/ExternalImageItemsModal';

type ItemWithRelations = Omit<items, 'lists' | 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  displayImageUrl?: string;
  catalogItemId?: string | null;
  catalog_items?: { imageUrl: string | null } | null;
  lists: Pick<lists, 'id' | 'title' | 'slug' | 'categoryId'> & {
    categories: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color'> | null;
  };
};

type ListWithCategory = Omit<lists, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  categories: categories | null;
};

interface ItemsPageClientProps {
  items: ItemWithRelations[];
  lists: ListWithCategory[];
  initialListId?: string;
  initialCategoryId?: string;
  itemCountsByList?: Record<string, number>;
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export default function ItemsPageClient({
  items,
  lists,
  initialListId,
  initialCategoryId,
  itemCountsByList = {},
  currentPage,
  perPage,
  totalItems,
  totalPages,
}: ItemsPageClientProps) {
  const router = useRouter();
  const [selectedListId, setSelectedListId] = useState<string>(
    initialListId || 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryId || 'all'
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPerPage, setCurrentPerPage] = useState<number>(perPage);
  const [externalImagesOpen, setExternalImagesOpen] = useState(false);

  useEffect(() => {
    setSelectedListId(initialListId || 'all');
    if (initialListId) {
      const list = lists.find((l) => l.id === initialListId);
      setSelectedCategory(list?.categories?.id ?? 'all');
    } else {
      setSelectedCategory(initialCategoryId || 'all');
    }
  }, [initialListId, initialCategoryId, lists]);

  useEffect(() => {
    setCurrentPerPage(perPage);
  }, [perPage]);

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          lists
            .filter((list) => list.categories !== null)
            .map((list) => [list.categories!.id, list.categories!])
        ).values()
      ),
    [lists]
  );

  const totalItemCount = useMemo(
    () => Object.values(itemCountsByList).reduce((sum, n) => sum + n, 0),
    [itemCountsByList]
  );

  const categoryItemCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const list of lists) {
      const catId = list.categories?.id;
      if (!catId) continue;
      map.set(catId, (map.get(catId) ?? 0) + (itemCountsByList[list.id] ?? 0));
    }
    return map;
  }, [lists, itemCountsByList]);

  /** وقتی listId در URL است، سرور فیلتر کرده — client دوباره فیلتر نمی‌کند */
  const filteredItems = useMemo(() => {
    if (selectedListId !== 'all') {
      return items;
    }
    return items.filter((item) => {
      if (!item.lists.categories) return false;
      return (
        selectedCategory === 'all' ||
        item.lists.categories.id === selectedCategory
      );
    });
  }, [items, selectedListId, selectedCategory]);

  const pushItemsUrl = (overrides: {
    page?: number;
    perPage?: number;
    listId?: string | null;
    categoryId?: string | null;
  }) => {
    const params = new URLSearchParams();
    params.set('page', String(overrides.page ?? currentPage));
    params.set('perPage', String(overrides.perPage ?? currentPerPage));
    const nextListId =
      overrides.listId === null
        ? undefined
        : overrides.listId ?? (selectedListId !== 'all' ? selectedListId : undefined);
    const nextCategoryId =
      overrides.categoryId === null
        ? undefined
        : overrides.categoryId ??
          (selectedCategory !== 'all' && !nextListId ? selectedCategory : undefined);
    if (nextListId) params.set('listId', nextListId);
    else if (nextCategoryId) params.set('categoryId', nextCategoryId);
    router.push(`/admin/items?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    pushItemsUrl({ page: newPage });
  };

  const handlePerPageChange = (newPerPage: number) => {
    setCurrentPerPage(newPerPage);
    pushItemsUrl({ page: 1, perPage: newPerPage });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedListId('all');
    pushItemsUrl({
      page: 1,
      listId: null,
      categoryId: categoryId === 'all' ? null : categoryId,
    });
  };

  const handleListFilterChange = (nextListId: string) => {
    setSelectedListId(nextListId);
    if (nextListId !== 'all') {
      const list = lists.find((l) => l.id === nextListId);
      setSelectedCategory(list?.categories?.id ?? 'all');
      pushItemsUrl({ page: 1, listId: nextListId, categoryId: null });
    } else {
      pushItemsUrl({
        page: 1,
        listId: null,
        categoryId: selectedCategory !== 'all' ? selectedCategory : null,
      });
    }
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
  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const canShowExternalImages =
    (selectedListId !== 'all' && Boolean(selectedList)) ||
    (selectedListId === 'all' && selectedCategory !== 'all');
  const externalImagesScopeTitle =
    selectedListId !== 'all' && selectedList
      ? selectedList.title
      : selectedCategoryObj
        ? `${selectedCategoryObj.name} — همه لیست‌های دسته`
        : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">آیتم‌ها</h1>
          <p className="text-sm text-gray-500">
            {selectedListId !== 'all' ? (
              <>
                لیست «{selectedList?.title}» · {totalItems.toLocaleString('fa-IR')} آیتم
                {totalPages > 1 &&
                  ` · صفحه ${currentPage.toLocaleString('fa-IR')} از ${totalPages.toLocaleString('fa-IR')}`}
              </>
            ) : selectedCategory !== 'all' ? (
              <>
                {categories.find((c) => c.id === selectedCategory)?.name ?? 'دسته'} ·{' '}
                {totalItems.toLocaleString('fa-IR')} آیتم
                {totalPages > 1 &&
                  ` · صفحه ${currentPage.toLocaleString('fa-IR')} از ${totalPages.toLocaleString('fa-IR')}`}
              </>
            ) : (
              <>
                همه لیست‌ها · {totalItems.toLocaleString('fa-IR')} آیتم
                {totalPages > 1 &&
                  ` · صفحه ${currentPage.toLocaleString('fa-IR')} از ${totalPages.toLocaleString('fa-IR')}`}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={
              selectedListId !== 'all'
                ? `/admin/items/import?listId=${selectedListId}`
                : '/admin/items/import'
            }
            className="inline-flex items-center gap-2 border border-violet-200 text-violet-700 px-5 py-2.5 rounded-lg hover:bg-violet-50 transition-colors font-medium whitespace-nowrap text-sm"
          >
            <FileJson className="w-4 h-4" />
            import گروهی JSON
          </Link>
          <Link
            href="/admin/catalog"
            className="border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap text-sm"
          >
            کاتالوگ
          </Link>
          {selectedListId !== 'all' && (
            <Link
              href={`/admin/items/new?listId=${selectedListId}`}
              className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors font-medium whitespace-nowrap"
            >
              + آیتم جدید
            </Link>
          )}
          <Link
            href="/admin/items/new"
            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
          >
            + آیتم جدید (همه لیست‌ها)
          </Link>
        </div>
      </div>

      {/* Category Filter (Chips) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-4">
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
              ({totalItemCount.toLocaleString('fa-IR')})
            </span>
          </button>
          {categories.map((category) => {
            const count = categoryItemCounts.get(category.id) ?? 0;
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
                <span className="text-xs opacity-75">({count.toLocaleString('fa-IR')})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List Filter (Dropdown) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              فیلتر بر اساس لیست:
            </label>
            <select
              value={selectedListId}
              onChange={(e) => handleListFilterChange(e.target.value)}
              className="w-full md:w-96 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 font-medium"
            >
              <option value="all">
                {selectedCategory === 'all'
                  ? `همه لیست‌ها (${totalItemCount.toLocaleString('fa-IR')})`
                  : `همه لیست‌های این دسته (${(categoryItemCounts.get(selectedCategory) ?? 0).toLocaleString('fa-IR')})`}
              </option>
              {filteredLists.map((list) => {
                const totalCount = itemCountsByList[list.id] ?? 0;
                return (
                  <option key={list.id} value={list.id}>
                    {list.categories?.icon || '📋'} {list.title} ({totalCount.toLocaleString('fa-IR')})
                  </option>
                );
              })}
            </select>
          </div>
          {canShowExternalImages && (
            <button
              type="button"
              onClick={() => setExternalImagesOpen(true)}
              className="inline-flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm font-medium hover:bg-amber-100 transition-colors"
              title="آیتم‌هایی که تصویرشان هنوز روی ParsPack نیست"
            >
              <Link2 className="w-4 h-4" />
              تصاویر خارج از ParsPack
            </button>
          )}
        </div>
      </div>

      {canShowExternalImages && (
        <ExternalImageItemsModal
          isOpen={externalImagesOpen}
          onClose={() => setExternalImagesOpen(false)}
          scopeTitle={externalImagesScopeTitle}
          listId={selectedListId !== 'all' ? selectedListId : undefined}
          categoryId={
            selectedListId === 'all' && selectedCategory !== 'all'
              ? selectedCategory
              : undefined
          }
          onMigrated={() => router.refresh()}
        />
      )}

      {/* Pagination Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Per Page Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">
              تعداد در هر صفحه:
            </label>
            <div className="flex gap-2">
              {[24, 48, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => handlePerPageChange(size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPerPage === size
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Page Info & Navigation */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              صفحه {currentPage.toLocaleString('fa-IR')} از{' '}
              {Math.max(1, totalPages).toLocaleString('fa-IR')} (
              {totalItems.toLocaleString('fa-IR')} آیتم
              {selectedListId !== 'all' && selectedList ? ` · ${selectedList.title}` : ''})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                قبلی
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بعدی
              </button>
            </div>
          </div>
        </div>

        {/* Page Numbers (for desktop) */}
        {totalPages > 1 && totalItems > 0 && (
          <div className="hidden md:flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
            {(() => {
              const pages = [];
              const maxVisible = 7;

              if (totalPages <= maxVisible) {
                // Show all pages
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Always show first page
                pages.push(1);

                if (currentPage > 3) {
                  pages.push('...');
                }

                // Show pages around current
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }

                if (currentPage < totalPages - 2) {
                  pages.push('...');
                }

                // Always show last page
                pages.push(totalPages);
              }

              return pages.map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page as number)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 text-lg font-medium mb-2">
            {selectedListId === 'all'
              ? 'هنوز آیتمی ایجاد نشده است'
              : 'این لیست هنوز آیتمی ندارد'}
          </p>
          {selectedListId !== 'all' && (
            <Link
              href={`/admin/items/new?listId=${selectedListId}`}
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium mt-4"
            >
              + افزودن اولین آیتم
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 flex flex-col"
            >
              <div className="relative h-40 w-full bg-gray-100">
                <AdminItemCardImage
                  itemId={item.id}
                  displaySrc={item.displayImageUrl || ''}
                  title={item.title}
                  categorySlug={item.lists.categories?.slug}
                  fallbackIcon={item.lists.categories?.icon || '📋'}
                  className="h-full w-full"
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                {/* List & Category Badge */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-base">{item.lists.categories?.icon || '📋'}</span>
                  <span className="text-xs text-gray-600 font-medium truncate flex-1 min-w-0">
                    {item.lists.title}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{item.order}</span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-base mb-2 line-clamp-2 min-h-[2.5rem]">{item.title}</h3>

                {/* Description */}
                {item.description && (
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2 flex-1">
                    {item.description}
                  </p>
                )}

                {/* Metadata */}
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-2.5 mb-3 text-xs flex-1">
                    {item.lists.categories && renderMetadata(item.metadata, item.lists.categories.slug)}
                  </div>
                )}

                {/* External URL */}
                {item.externalUrl && (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline mb-3 block"
                  >
                    🔗 اطلاعات بیشتر
                  </a>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2">
                  <Link
                    href={`/admin/items/${item.id}/edit`}
                    className="flex-1 text-center bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                  >
                    ویرایش
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50 text-sm whitespace-nowrap"
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
      <div className="space-y-1.5">
        {metadata.imdbRating && (
          <div className="flex items-center gap-1.5 text-gray-700 mb-1.5">
            <span className="text-xs text-yellow-500">⭐</span>
            <span className="text-xs font-semibold">{metadata.imdbRating}</span>
            <span className="text-xs text-gray-500">IMDb</span>
          </div>
        )}
        {metadata.year && (
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="text-xs">📅</span>
            <span className="text-xs">سال:</span>
            <span className="text-xs font-medium">{metadata.year}</span>
          </div>
        )}
        {metadata.genre && (
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="text-xs">🎭</span>
            <span className="text-xs">ژانر:</span>
            <span className="text-xs font-medium">{metadata.genre}</span>
          </div>
        )}
        {metadata.director && (
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="text-xs">🎬</span>
            <span className="text-xs">کارگردان:</span>
            <span className="text-xs font-medium truncate">{metadata.director}</span>
          </div>
        )}
      </div>
    );
  }

  if (categorySlug === 'book' || categorySlug === 'books') {
    return (
      <div className="space-y-1.5">
        {metadata.author && (
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="text-xs">✍️</span>
            <span className="text-xs">نویسنده:</span>
            <span className="text-xs font-medium">{metadata.author}</span>
          </div>
        )}
        {metadata.genre && (
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="text-xs">📚</span>
            <span className="text-xs">ژانر:</span>
            <span className="text-xs font-medium">{metadata.genre}</span>
          </div>
        )}
      </div>
    );
  }

  if (categorySlug === 'cafe' || categorySlug === 'restaurant') {
    return (
      <div className="space-y-1.5">
        {metadata.address && (
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="text-xs">📍</span>
            <span className="text-xs">آدرس:</span>
            <span className="text-xs font-medium truncate">{metadata.address}</span>
          </div>
        )}
        {metadata.priceRange && (
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="text-xs">💰</span>
            <span className="text-xs">قیمت:</span>
            <span className="text-xs font-medium">{metadata.priceRange}</span>
          </div>
        )}
        {metadata.cuisine && (
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="text-xs">🍽️</span>
            <span className="text-xs">نوع غذا:</span>
            <span className="text-xs font-medium">{metadata.cuisine}</span>
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
