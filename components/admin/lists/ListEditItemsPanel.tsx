'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GripVertical, Trash2, Pencil, Loader2 } from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';

type ListItem = { id: string; title: string; description: string | null; order: number };

interface ListEditItemsPanelProps {
  listId: string;
  initialItems: ListItem[];
}

async function persistItemOrder(items: ListItem[]) {
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

export default function ListEditItemsPanel({ listId, initialItems }: ListEditItemsPanelProps) {
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

  const duplicateTitles = items
    .map((i) => i.title?.trim().toLowerCase())
    .filter((t, i, arr) => t && arr.indexOf(t) !== i);
  const hasDuplicate = duplicateTitles.length > 0;

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

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('این آیتم حذف شود؟')) return;
    try {
      const res = await fetch(`/api/admin/items/${itemId}`, { method: 'DELETE' });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)]">
      <div className="px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-bg)]/50 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            آیتم‌ها
            <span className="text-[var(--color-text-muted)] font-normal mr-1">({items.length})</span>
          </h2>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
            {reorderLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                در حال ذخیره ترتیب…
              </>
            ) : (
              'بکشید و رها کنید برای تغییر ترتیب'
            )}
          </p>
        </div>
        <div className="flex gap-1.5">
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
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/15"
          >
            مدیریت
          </Link>
        </div>
      </div>

      {hasDuplicate && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
          عنوان تکراری وجود دارد؛ بررسی کنید.
        </div>
      )}

      <ul className="divide-y divide-[var(--color-border-muted)] max-h-[400px] overflow-y-auto">
        {items.length === 0 ? (
          <li className="text-sm text-[var(--color-text-muted)] p-4">هنوز آیتمی اضافه نشده است.</li>
        ) : (
          items.map((item, index) => (
            <li
              key={item.id}
              draggable={!reorderLoading}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 px-3 py-2.5 transition-colors group ${
                dragIndex === index
                  ? 'bg-[var(--primary)]/8 cursor-grabbing'
                  : 'hover:bg-[var(--color-bg)]/40 cursor-grab active:cursor-grabbing'
              }`}
            >
              <GripVertical className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 opacity-50 group-hover:opacity-100" />
              <span className="text-[10px] font-bold text-[var(--color-text-muted)] w-5 tabular-nums text-center shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">{item.title}</p>
                {item.description && (
                  <p className="text-[10px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5">{item.description}</p>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Link
                  href={`/admin/items/${item.id}/edit`}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
                  title="ویرایش آیتم"
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
          ))
        )}
      </ul>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={2500} />
      )}
    </div>
  );
}
