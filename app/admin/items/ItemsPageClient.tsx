'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { items, lists, categories } from '@prisma/client';
import { FileJson, CheckSquare, Square } from 'lucide-react';
import AdminItemCard from '@/components/admin/items/AdminItemCard';
import ExternalImageItemsModal from '@/components/admin/items/ExternalImageItemsModal';
import ItemsBulkToolbar from '@/components/admin/items/ItemsBulkToolbar';
import ItemsImageToolbar from '@/components/admin/items/ItemsImageToolbar';
import { isMovieCategorySlug } from '@/lib/movie-category';

type ItemWithRelations = Omit<items, 'lists' | 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  displayImageUrl?: string;
  catalogItemId?: string | null;
  catalog_items?: { imageUrl: string | null } | null;
  item_moderation?: { status: string } | null;
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
  const [wrappingProxy, setWrappingProxy] = useState(false);
  const [proxyMessage, setProxyMessage] = useState<string | null>(null);
  const [refreshingOmdb, setRefreshingOmdb] = useState(false);
  const [omdbMessage, setOmdbMessage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

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

  const toggleSelectionMode = () => {
    setSelectionMode((v) => {
      if (v) setSelectedIds(new Set());
      return !v;
    });
    setBulkMessage(null);
    setBulkError(null);
  };

  const toggleItemSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = filteredItems.map((item) => item.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const selectedItems = useMemo(
    () => filteredItems.filter((item) => selectedIds.has(item.id)),
    [filteredItems, selectedIds]
  );

  const allOnPageSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

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

  const isMovieCategory = useMemo(() => {
    if (selectedListId !== 'all' && selectedList?.categories?.slug) {
      return isMovieCategorySlug(selectedList.categories.slug);
    }
    if (selectedCategory !== 'all') {
      return isMovieCategorySlug(selectedCategoryObj?.slug);
    }
    return false;
  }, [selectedListId, selectedList, selectedCategory, selectedCategoryObj]);

  const handleWrapImageProxy = async () => {
    if (!canShowExternalImages) return;
    const scopeLabel =
      selectedListId !== 'all' && selectedList
        ? `لیست «${selectedList.title}»`
        : selectedCategoryObj
          ? `دسته «${selectedCategoryObj.name}»`
          : '';

    setWrappingProxy(true);
    setProxyMessage(null);
    try {
      const params = new URLSearchParams();
      if (selectedListId !== 'all') params.set('listId', selectedListId);
      else if (selectedCategory !== 'all') params.set('categoryId', selectedCategory);

      const previewRes = await fetch(`/api/admin/items/wrap-image-proxy?${params.toString()}`);
      const preview = await previewRes.json();
      if (!previewRes.ok || !preview.success) {
        throw new Error(preview.error || 'خطا در شمارش');
      }

      if (preview.count === 0) {
        setProxyMessage(
          `همه ${preview.totalInScope.toLocaleString('fa-IR')} آیتم از قبل روی ParsPack یا پراکسی هستند — موردی برای تغییر نیست.`
        );
        return;
      }

      const sampleTitles = (preview.samples as { title: string }[])
        .slice(0, 3)
        .map((s) => s.title)
        .join('، ');

      const confirmMsg = [
        `${preview.count.toLocaleString('fa-IR')} تصویر در ${scopeLabel} بدون پراکسی هستند (خارج از ParsPack).`,
        preview.totalInScope > preview.count
          ? `${(preview.totalInScope - preview.count).toLocaleString('fa-IR')} مورد دیگر بدون تغییر می‌ماند.`
          : null,
        sampleTitles ? `نمونه: ${sampleTitles}` : null,
        '',
        'آدرس castando proxy به imageUrl در DB اضافه و ذخیره شود؟',
      ]
        .filter(Boolean)
        .join('\n');

      if (!confirm(confirmMsg)) return;

      const res = await fetch('/api/admin/items/wrap-image-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: selectedListId !== 'all' ? selectedListId : undefined,
          categoryId:
            selectedListId === 'all' && selectedCategory !== 'all'
              ? selectedCategory
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'اعمال پراکسی ناموفق');
      setProxyMessage(data.message || 'پراکسی در DB ذخیره شد');
      router.refresh();
    } catch (e: unknown) {
      setProxyMessage(e instanceof Error ? e.message : 'خطا در اعمال پراکسی');
    } finally {
      setWrappingProxy(false);
    }
  };

  const handleOmdbRefresh = async () => {
    if (!canShowExternalImages || !isMovieCategory) return;
    const scopeLabel =
      selectedListId !== 'all' && selectedList
        ? `لیست «${selectedList.title}»`
        : selectedCategoryObj
          ? `دسته «${selectedCategoryObj.name}»`
          : '';

    setRefreshingOmdb(true);
    setOmdbMessage(null);
    try {
      const params = new URLSearchParams();
      if (selectedListId !== 'all') params.set('listId', selectedListId);
      else if (selectedCategory !== 'all') params.set('categoryId', selectedCategory);

      const previewRes = await fetch(`/api/admin/items/refresh-omdb-images?${params.toString()}`);
      const preview = await previewRes.json();
      if (!previewRes.ok || !preview.success) {
        throw new Error(preview.error || 'خطا در شمارش');
      }

      if (preview.count === 0) {
        if (preview.totalProxy > 0) {
          setOmdbMessage(
            `${preview.totalProxy.toLocaleString('fa-IR')} آیتم پراکسی هستند اما imdbId ندارند — OMDb قابل استفاده نیست.`
          );
        } else {
          setOmdbMessage('آیتمی با تصویر پراکسی در این محدوده نیست.');
        }
        return;
      }

      const sampleTitles = (preview.samples as { title: string; imdbId: string }[])
        .slice(0, 3)
        .map((s) => `${s.title} (${s.imdbId})`)
        .join('، ');

      const confirmMsg = [
        `${preview.count.toLocaleString('fa-IR')} فیلم با تصویر پراکسی در ${scopeLabel}.`,
        preview.noImdb > 0
          ? `${preview.noImdb.toLocaleString('fa-IR')} مورد پراکسی بدون imdbId رد می‌شود.`
          : null,
        sampleTitles ? `نمونه: ${sampleTitles}` : null,
        '',
        'پوستر از OMDb دریافت و در ParsPack (imageUrl) ذخیره شود؟',
      ]
        .filter(Boolean)
        .join('\n');

      if (!confirm(confirmMsg)) return;

      const res = await fetch('/api/admin/items/refresh-omdb-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: selectedListId !== 'all' ? selectedListId : undefined,
          categoryId:
            selectedListId === 'all' && selectedCategory !== 'all'
              ? selectedCategory
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'به‌روزرسانی OMDb ناموفق');
      setOmdbMessage(data.message || 'تصاویر از OMDb به‌روز شد');
      router.refresh();
    } catch (e: unknown) {
      setOmdbMessage(e instanceof Error ? e.message : 'خطا در OMDb');
    } finally {
      setRefreshingOmdb(false);
    }
  };

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
          <ItemsImageToolbar
            showTools={canShowExternalImages}
            showOmdb={canShowExternalImages && isMovieCategory}
            wrappingProxy={wrappingProxy}
            refreshingOmdb={refreshingOmdb}
            onOpenS3={() => setExternalImagesOpen(true)}
            onWrapProxy={() => void handleWrapImageProxy()}
            onOmdbRefresh={() => void handleOmdbRefresh()}
          />
          {filteredItems.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`inline-flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                selectionMode
                  ? 'border-violet-300 bg-violet-100 text-violet-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selectionMode ? 'خروج از انتخاب' : 'انتخاب گروهی'}
            </button>
          )}
        </div>
        {(proxyMessage || omdbMessage) && (
          <div className="space-y-2 mt-3">
            {proxyMessage && (
              <p className="text-xs text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
                {proxyMessage}
              </p>
            )}
            {omdbMessage && (
              <p className="text-xs text-violet-800 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                {omdbMessage}
              </p>
            )}
          </div>
        )}
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

      {/* Bulk feedback */}
      {(bulkMessage || bulkError) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            bulkError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {bulkError || bulkMessage}
        </div>
      )}

      {/* Results bar */}
      {filteredItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 px-1">
          <p className="text-sm text-gray-600">
            <span className="font-bold text-gray-900 tabular-nums">
              {totalItems.toLocaleString('fa-IR')}
            </span>{' '}
            آیتم
            {selectedListId !== 'all' && selectedList ? ` · ${selectedList.title}` : ''}
            {totalPages > 1 && (
              <>
                {' '}
                · صفحه{' '}
                <span className="font-semibold tabular-nums">
                  {currentPage.toLocaleString('fa-IR')}
                </span>{' '}
                از{' '}
                <span className="font-semibold tabular-nums">
                  {totalPages.toLocaleString('fa-IR')}
                </span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">در هر صفحه:</span>
            {[24, 48, 100].map((size) => (
              <button
                key={size}
                onClick={() => handlePerPageChange(size)}
                className={`min-w-[2.5rem] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  currentPerPage === size
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

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
        <>
          {selectionMode && selectedIds.size > 0 && (
            <ItemsBulkToolbar
              selectedIds={[...selectedIds]}
              selectedTitles={selectedItems.map((i) => i.title)}
              onClear={clearSelection}
              onDone={(message) => {
                setBulkMessage(message);
                setBulkError(null);
                setSelectedIds(new Set());
                setSelectionMode(false);
                router.refresh();
              }}
              onError={(message) => {
                setBulkError(message);
                setBulkMessage(null);
              }}
            />
          )}

          {selectionMode && (
            <div className="flex items-center gap-3 mb-3 px-1">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAllOnPage}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                انتخاب همه در این صفحه ({filteredItems.length.toLocaleString('fa-IR')})
              </label>
              {selectedIds.size > 0 && (
                <span className="text-sm text-violet-700 font-semibold tabular-nums">
                  {selectedIds.size.toLocaleString('fa-IR')} انتخاب
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {filteredItems.map((item) => (
              <AdminItemCard
                key={item.id}
                item={item}
                showListContext={selectedListId === 'all'}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(item.id)}
                isDeleting={deletingId === item.id}
                onToggleSelect={() => toggleItemSelection(item.id)}
                onDelete={() => void handleDelete(item.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  قبلی
                </button>
                <div className="hidden sm:flex items-center gap-1.5">
                  {buildPageNumbers(currentPage, totalPages).map((page, index) =>
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`min-w-[2.5rem] rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                          currentPage === page
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <span className="sm:hidden text-sm font-medium text-gray-600 tabular-nums">
                  {currentPage.toLocaleString('fa-IR')} / {totalPages.toLocaleString('fa-IR')}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function buildPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  const pages: (number | '...')[] = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (currentPage > 3) pages.push('...');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push('...');
  pages.push(totalPages);
  return pages;
}
