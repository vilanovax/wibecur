'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GripVertical, Trash2, Pencil, Loader2 } from 'lucide-react';
import EntryKindBadge, { resolveItemEntryKind } from '@/components/admin/items/EntryKindBadge';
import { entryKindIcon, isLightweightListItem } from '@/lib/list-entry';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import Toast, { type ToastType } from '@/components/shared/Toast';
import type { ListWorkspaceItem } from '@/lib/admin/list-workspace-data';

interface ListWorkspaceItemsPanelProps {
  listId: string;
  categorySlug: string | null;
  categoryIcon: string | null;
  initialItems: ListWorkspaceItem[];
}

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

export default function ListWorkspaceItemsPanel({
  listId,
  categorySlug,
  categoryIcon,
  initialItems,
}: ListWorkspaceItemsPanelProps) {
  const router = useRouter();
  const sortedInitial = [...initialItems].sort((a, b) => a.order - b.order);
  const [items, setItems] = useState(sortedInitial);
  const itemsRef = useRef(sortedInitial);
  const orderChangedRef = useRef(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const sorted = [...initialItems].sort((a, b) => a.order - b.order);
    setItems(sorted);
    itemsRef.current = sorted;
  }, [initialItems]);

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
      router.refresh();
    } catch {
      setToast({ message: 'خطا در ذخیره ترتیب', type: 'error' });
    } finally {
      setReorderLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('این آیتم از لیست حذف شود؟')) return;
    try {
      const res = await fetch(`/api/admin/items/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        router.refresh();
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
      <div className="px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-bg)]/50 flex flex-wrap items-center justify-between gap-2">
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
              'کشیدن برای تغییر ترتیب · کلیک برای ویرایش'
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
        </div>
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
      ) : (
        <ul className="divide-y divide-[var(--color-border-muted)] max-h-[calc(100vh-18rem)] overflow-y-auto">
          {items.map((item, index) => {
            const entryKind = resolveItemEntryKind(item);
            const lightweight = isLightweightListItem(item);

            return (
            <li
              key={item.id}
              draggable={!reorderLoading}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors group ${
                dragIndex === index
                  ? 'bg-[var(--primary)]/8 cursor-grabbing'
                  : 'hover:bg-[var(--color-bg)]/40 cursor-grab active:cursor-grabbing'
              }`}
            >
              <GripVertical className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 opacity-40 group-hover:opacity-100" />
              <span className="text-xs font-bold text-[var(--color-text-muted)] w-6 tabular-nums text-center shrink-0">
                {(index + 1).toLocaleString('fa-IR')}
              </span>
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border-muted)] bg-gray-100">
                {lightweight ? (
                  <div className="flex h-full w-full items-center justify-center bg-amber-50 text-xl">
                    {entryKindIcon(entryKind)}
                  </div>
                ) : (
                  <ImageWithFallback
                    src={item.displayImageUrl || item.imageUrl || ''}
                    alt=""
                    className="h-full w-full object-cover"
                    categorySlug={categorySlug}
                    fallbackIcon={categoryIcon ?? '📌'}
                    fallbackClassName="flex h-full w-full items-center justify-center text-lg"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-semibold text-[var(--color-text)] truncate min-w-0 flex-1">
                    {item.title}
                  </p>
                  <EntryKindBadge kind={entryKind} compact />
                </div>
                {item.description && (
                  <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Link
                  href={`/admin/items/${item.id}/edit`}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
                  title="ویرایش"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
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
