'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  GripVertical,
  Trash2,
  Pencil,
  Loader2,
  Search,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  X,
  Link2,
  BookOpen,
  Coffee,
} from 'lucide-react';
import BookCoverItemsModal from '@/components/admin/items/BookCoverItemsModal';
import CafeCoverItemsModal from '@/components/admin/items/CafeCoverItemsModal';
import { isBookCategorySlug } from '@/lib/book-cover-search';
import { isCafeCategorySlug } from '@/lib/cafe-cover-search';
import { resolveItemEntryKind } from '@/components/admin/items/EntryKindBadge';
import { entryKindIcon, isLightweightListItem } from '@/lib/list-entry';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import Toast, { type ToastType } from '@/components/shared/Toast';
import type { ListWorkspaceItem } from '@/lib/admin/list-workspace-data';
import { buildListItemPreviewPath } from '@/lib/list-item-preview-url';
import { toAdminStorageImageSrc } from '@/lib/liara-image-url';

interface ListWorkspaceItemsPanelProps {
  listId: string;
  listSlug: string;
  listTitle: string;
  categorySlug: string | null;
  categoryIcon: string | null;
  initialItems: ListWorkspaceItem[];
  onItemsUpdated?: () => void;
}

type ViewMode = 'grid' | 'list';

async function persistItemOrder(items: ListWorkspaceItem[]) {
  const results = await Promise.all(
    items.map((item, i) =>
      fetch(`/api/admin/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: i }),
      })
    )
  );
  if (results.some((r) => !r.ok)) throw new Error('reorder failed');
}

function normalizeSearch(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function ListWorkspaceItemsPanel({
  listId,
  listSlug,
  listTitle,
  categorySlug,
  categoryIcon,
  initialItems,
  onItemsUpdated,
}: ListWorkspaceItemsPanelProps) {
  const isBookCategory = isBookCategorySlug(categorySlug);
  const isCafeCategory = isCafeCategorySlug(categorySlug);
  const [bookCoverModalOpen, setBookCoverModalOpen] = useState(false);
  const [cafeCoverModalOpen, setCafeCoverModalOpen] = useState(false);
  const sortedInitial = useMemo(
    () => [...initialItems].sort((a, b) => a.order - b.order),
    [initialItems]
  );

  const [items, setItems] = useState(sortedInitial);
  const itemsRef = useRef(sortedInitial);
  const orderChangedRef = useRef(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    setItems(sortedInitial);
    itemsRef.current = sortedInitial;
    setSelectedIds(new Set());
  }, [sortedInitial]);

  const filteredItems = useMemo(() => {
    const q = normalizeSearch(searchQuery);
    if (!q) return items;
    return items.filter((item) => normalizeSearch(item.title).includes(q));
  }, [items, searchQuery]);

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const moveItem = useCallback((from: number, to: number) => {
    if (from === to) return;
    orderChangedRef.current = true;
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      itemsRef.current = next;
      return next;
    });
  }, []);

  const handleDragStart = (index: number) => {
    orderChangedRef.current = false;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    moveItem(dragIndex, index);
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    if (dragIndex === null) return;
    setDragIndex(null);
    if (!orderChangedRef.current) return;
    orderChangedRef.current = false;
    setReorderLoading(true);
    try {
      await persistItemOrder(itemsRef.current);
      setToast({ message: 'ترتیب آیتم‌ها ذخیره شد', type: 'success' });
    } catch {
      setToast({ message: 'خطا در ذخیره ترتیب', type: 'error' });
    } finally {
      setReorderLoading(false);
    }
  };

  const removeItemsFromState = (ids: string[]) => {
    const idSet = new Set(ids);
    setItems((prev) => {
      const next = prev.filter((i) => !idSet.has(i.id));
      itemsRef.current = next;
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('این آیتم از لیست حذف شود؟')) return;
    setDeletingIds((prev) => new Set(prev).add(itemId));
    try {
      const res = await fetch(`/api/admin/items/${itemId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        removeItemsFromState([itemId]);
        setToast({ message: 'آیتم حذف شد', type: 'success' });
      } else {
        setToast({ message: data.error || 'خطا در حذف آیتم', type: 'error' });
      }
    } catch {
      setToast({ message: 'خطا در حذف آیتم', type: 'error' });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!confirm(`${ids.length.toLocaleString('fa-IR')} آیتم حذف شود؟`)) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: ids, action: 'delete' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        removeItemsFromState(ids);
        setToast({
          message: `${(data.processed ?? ids.length).toLocaleString('fa-IR')} آیتم حذف شد`,
          type: 'success',
        });
      } else {
        setToast({ message: data.error || 'خطا در حذف گروهی', type: 'error' });
      }
    } catch {
      setToast({ message: 'خطا در حذف گروهی', type: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const renderThumbnail = (item: ListWorkspaceItem) => {
    const entryKind = resolveItemEntryKind(item);
    const lightweight = isLightweightListItem(item);
    const rawThumb =
      item.displayImageUrl?.trim() ||
      item.imageUrl?.trim() ||
      item.catalogImageUrl?.trim() ||
      '';
    const imageSrc = rawThumb ? toAdminStorageImageSrc(rawThumb) || rawThumb : '';

    if (!imageSrc && lightweight) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-amber-50 text-2xl">
          {entryKindIcon(entryKind)}
        </div>
      );
    }

    if (!imageSrc) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xl">
          {categoryIcon ?? '📌'}
        </div>
      );
    }

    return (
      <ImageWithFallback
        src={imageSrc}
        alt=""
        className="h-full w-full object-cover"
        preferStoredImage
        fallbackIcon={categoryIcon ?? '📌'}
        fallbackClassName="flex h-full w-full items-center justify-center text-xl"
      />
    );
  };

  const renderEntryLink = (item: ListWorkspaceItem) => {
    const previewHref = buildListItemPreviewPath(listSlug, item.id);
    if (!previewHref) return null;

    return (
      <a
        href={previewHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-900 ring-1 ring-sky-200/80 hover:bg-sky-100 transition-colors"
        title="پیش‌نمایش آیتم در اپ"
        onClick={(e) => e.stopPropagation()}
      >
        <Link2 className="w-3 h-3 shrink-0" aria-hidden />
        <span className="truncate">لینک</span>
      </a>
    );
  };

  const renderItemActions = (item: ListWorkspaceItem, compact = false) => {
    const isDeleting = deletingIds.has(item.id);
    return (
      <div className={`flex items-center gap-0.5 shrink-0 ${compact ? '' : 'opacity-100'}`}>
        <Link
          href={`/admin/items/${item.id}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--primary)] transition-colors"
          title="ویرایش در تب جدید"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          disabled={isDeleting || bulkLoading}
          onClick={() => void handleRemoveItem(item.id)}
          className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-40 transition-colors"
          title="حذف"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );
  };

  const renderSelectButton = (itemId: string) => (
    <button
      type="button"
      onClick={() => toggleSelect(itemId)}
      className="p-1 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--primary)] transition-colors"
      title={selectedIds.has(itemId) ? 'لغو انتخاب' : 'انتخاب'}
      aria-pressed={selectedIds.has(itemId)}
    >
      {selectedIds.has(itemId) ? (
        <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
      ) : (
        <Square className="w-4 h-4" />
      )}
    </button>
  );

  const renderDragHandle = (index: number) => (
    <button
      type="button"
      draggable={!reorderLoading && !searchQuery}
      disabled={reorderLoading || Boolean(searchQuery)}
      onDragStart={() => handleDragStart(index)}
      onDragEnd={() => void handleDragEnd()}
      className="p-1 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] cursor-grab active:cursor-grabbing disabled:opacity-30 disabled:cursor-not-allowed touch-none"
      title={searchQuery ? 'برای مرتب‌سازی، جستجو را پاک کنید' : 'کشیدن برای تغییر ترتیب'}
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );

  return (
    <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
      {isBookCategory && (
        <BookCoverItemsModal
          isOpen={bookCoverModalOpen}
          onClose={() => setBookCoverModalOpen(false)}
          scopeTitle={listTitle}
          listId={listId}
          onUpdated={onItemsUpdated}
        />
      )}
      {isCafeCategory && (
        <CafeCoverItemsModal
          isOpen={cafeCoverModalOpen}
          onClose={() => setCafeCoverModalOpen(false)}
          scopeTitle={listTitle}
          listId={listId}
          onUpdated={onItemsUpdated}
        />
      )}
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-bg)]/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              آیتم‌های لیست
              <span className="text-[var(--color-text-muted)] font-normal mr-1">
                ({items.length.toLocaleString('fa-IR')})
              </span>
            </h2>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
              {reorderLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  در حال ذخیره ترتیب…
                </>
              ) : (
                'انتخاب گروهی · جستجو · نمای گرید'
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/admin/lists?view=catalog&mode=place&listId=${listId}`}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:opacity-90"
            >
              + افزودن
            </Link>
            <Link
              href={`/admin/lists?view=import&listId=${listId}`}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              import JSON
            </Link>
            <Link
              href={`/admin/lists?view=catalog&mode=place&listId=${listId}`}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              کاتالوگ
            </Link>
            {isBookCategory && (
              <button
                type="button"
                onClick={() => setBookCoverModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
              >
                <BookOpen className="w-3.5 h-3.5" />
                کاور ParsPack
              </button>
            )}
            {isCafeCategory && (
              <button
                type="button"
                onClick={() => setCafeCoverModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-orange-200 text-orange-800 bg-orange-50 hover:bg-orange-100"
              >
                <Coffee className="w-3.5 h-3.5" />
                تصویر ParsPack
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در آیتم‌ها…"
              className="w-full rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] py-2 pr-9 pl-8 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                aria-label="پاک کردن جستجو"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center rounded-xl border border-[var(--color-border-muted)] p-0.5 bg-[var(--color-surface)]">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
              }`}
              title="نمای گرید"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
              }`}
              title="نمای لیست"
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[var(--color-border-muted)] hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              {searchQuery
                ? allFilteredSelected
                  ? 'لغو انتخاب نتایج'
                  : 'انتخاب نتایج جستجو'
                : allFilteredSelected
                  ? 'لغو انتخاب همه'
                  : 'انتخاب همه'}
            </button>

            {selectedIds.size > 0 && (
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => void handleBulkDelete()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                حذف {selectedIds.size.toLocaleString('fa-IR')} آیتم
              </button>
            )}

            {searchQuery && (
              <span className="text-[11px] text-[var(--color-text-muted)] mr-auto">
                {filteredItems.length.toLocaleString('fa-IR')} نتیجه از{' '}
                {items.length.toLocaleString('fa-IR')}
              </span>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">هنوز آیتمی در این لیست نیست</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href={`/admin/lists?view=catalog&mode=place&listId=${listId}`}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold"
            >
              افزودن از کاتالوگ
            </Link>
            <Link
              href={`/admin/lists?view=import&listId=${listId}`}
              className="inline-flex items-center px-4 py-2 rounded-xl border border-violet-200 text-violet-700 text-sm font-semibold"
            >
              import گروهی
            </Link>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
          آیتمی با این عبارت پیدا نشد.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {filteredItems.map((item) => {
            const globalIndex = items.findIndex((i) => i.id === item.id);
            const isSelected = selectedIds.has(item.id);

            return (
              <article
                key={item.id}
                onDragOver={(e) => handleDragOver(e, globalIndex)}
                className={`group relative flex flex-col rounded-xl border overflow-hidden transition-all ${
                  isSelected
                    ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                    : 'border-[var(--color-border-muted)] hover:border-[var(--primary)]/30 hover:shadow-sm'
                } ${dragIndex === globalIndex ? 'opacity-60 scale-[0.98]' : ''}`}
              >
                <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5">
                  {renderSelectButton(item.id)}
                  {renderDragHandle(globalIndex)}
                </div>

                <div className="relative aspect-[3/4] bg-gray-100 border-b border-[var(--color-border-muted)]">
                  {renderThumbnail(item)}
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                    {(globalIndex + 1).toLocaleString('fa-IR')}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1.5 p-2.5 min-h-0">
                  <div className="flex items-start gap-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-text)] line-clamp-2 leading-snug flex-1 min-w-0">
                      {item.title}
                    </p>
                  </div>
                  {renderEntryLink(item)}
                  <div className="mt-auto pt-1 flex items-center justify-end border-t border-[var(--color-border-muted)]/60">
                    {renderItemActions(item, true)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border-muted)] max-h-[calc(100vh-16rem)] overflow-y-auto">
          {filteredItems.map((item) => {
            const globalIndex = items.findIndex((i) => i.id === item.id);
            const isSelected = selectedIds.has(item.id);

            return (
              <li
                key={item.id}
                onDragOver={(e) => handleDragOver(e, globalIndex)}
                className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
                  isSelected ? 'bg-[var(--primary)]/5' : 'hover:bg-[var(--color-bg)]/40'
                } ${dragIndex === globalIndex ? 'bg-[var(--primary)]/8' : ''}`}
              >
                {renderSelectButton(item.id)}
                {renderDragHandle(globalIndex)}
                <span className="text-xs font-bold text-[var(--color-text-muted)] w-6 tabular-nums text-center shrink-0">
                  {(globalIndex + 1).toLocaleString('fa-IR')}
                </span>
                <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border-muted)] bg-gray-100">
                  {renderThumbnail(item)}
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--color-text)] truncate min-w-0">
                    {item.title}
                  </p>
                  {renderEntryLink(item)}
                </div>
                {renderItemActions(item)}
              </li>
            );
          })}
        </ul>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={2500} />
      )}
    </div>
  );
}
