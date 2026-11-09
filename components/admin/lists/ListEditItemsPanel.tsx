'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  GripVertical,
  Trash2,
  Pencil,
  Loader2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';

type ListItem = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  catalogItemId?: string | null;
};

interface ListEditItemsPanelProps {
  listId: string;
  initialItems: ListItem[];
}

async function persistItemOrder(listId: string, items: ListItem[]) {
  const res = await fetch(`/api/admin/lists/${listId}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds: items.map((item) => item.id) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'خطا در ذخیره ترتیب'
    );
  }
}

export default function ListEditItemsPanel({ listId, initialItems }: ListEditItemsPanelProps) {
  const sortedInitial = [...initialItems].sort((a, b) => a.order - b.order);
  const [items, setItems] = useState(sortedInitial);
  const itemsRef = useRef(sortedInitial);
  const orderChangedRef = useRef(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderValue, setEditingOrderValue] = useState('');

  useEffect(() => {
    const sorted = [...initialItems].sort((a, b) => a.order - b.order);
    setItems(sorted);
    itemsRef.current = sorted;
  }, [initialItems]);

  const duplicateTitles = items
    .map((i) => i.title?.trim().toLowerCase())
    .filter((t, i, arr) => t && arr.indexOf(t) !== i);
  const hasDuplicate = duplicateTitles.length > 0;

  const commitOrder = useCallback(
    async (next: ListItem[]) => {
      setReorderLoading(true);
      try {
        await persistItemOrder(listId, next);
        setToast({ message: 'ترتیب آیتم‌ها ذخیره شد', type: 'success' });
      } catch (err: unknown) {
        setToast({
          message: err instanceof Error ? err.message : 'خطا در ذخیره ترتیب',
          type: 'error',
        });
      } finally {
        setReorderLoading(false);
      }
    },
    [listId]
  );

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

  const moveByStep = async (index: number, delta: -1 | 1) => {
    const to = index + delta;
    if (to < 0 || to >= itemsRef.current.length || reorderLoading) return;
    const next = [...itemsRef.current];
    const [removed] = next.splice(index, 1);
    next.splice(to, 0, removed);
    itemsRef.current = next;
    setItems(next);
    await commitOrder(next);
  };

  const applyNumericOrder = async (itemId: string, raw: string) => {
    setEditingOrderId(null);
    const parsed = Number.parseInt(raw.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setToast({ message: 'شماره ترتیب باید ۱ یا بیشتر باشد', type: 'error' });
      return;
    }
    const from = itemsRef.current.findIndex((i) => i.id === itemId);
    if (from < 0) return;
    const to = Math.min(Math.max(parsed - 1, 0), itemsRef.current.length - 1);
    if (from === to) return;
    const next = [...itemsRef.current];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    itemsRef.current = next;
    setItems(next);
    await commitOrder(next);
  };

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
    await commitOrder(itemsRef.current);
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('این آیتم فقط از این لیست حذف شود؟ کاتالوگ دست نخورده می‌ماند.')) return;
    try {
      const res = await fetch(`/api/admin/lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems((prev) => {
          const next = prev.filter((i) => i.id !== itemId);
          itemsRef.current = next;
          return next;
        });
        setToast({ message: 'آیتم از این لیست حذف شد', type: 'success' });
      } else {
        setToast({
          message: typeof data.error === 'string' ? data.error : 'خطا در حذف از لیست',
          type: 'error',
        });
      }
    } catch {
      setToast({ message: 'خطا در حذف از لیست', type: 'error' });
    }
  };

  return (
    <div className="rounded-xl border border-(--color-border-muted) bg-(--color-surface) overflow-hidden shadow-(--shadow-card)">
      <div className="px-4 py-3 border-b border-(--color-border-muted) bg-(--color-bg)/50 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-(--color-text)">
            آیتم‌ها
            <span className="text-wibe-secondary font-normal me-1">({items.length})</span>
          </h2>
          <p className="text-[10px] text-wibe-secondary mt-0.5 flex items-center gap-1">
            {reorderLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                در حال ذخیره ترتیب…
              </>
            ) : (
              'کشیدن، ↑↓ یا شماره ترتیب'
            )}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Link
            href={`/admin/lists?view=catalog&mode=place&listId=${listId}`}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-primary text-white hover:opacity-90"
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
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15"
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

      <ul className="divide-y divide-(--color-border-muted) max-h-100 overflow-y-auto">
        {items.length === 0 ? (
          <li className="text-sm text-wibe-secondary p-4">هنوز آیتمی اضافه نشده است.</li>
        ) : (
          items.map((item, index) => (
            <li
              key={item.id}
              onDragOver={(e) => handleDragOver(e, index)}
              className={`flex items-center gap-2 px-3 py-2.5 transition-colors group ${
                dragIndex === index ? 'bg-primary/8' : 'hover:bg-(--color-bg)/40'
              }`}
            >
              <button
                type="button"
                draggable={!reorderLoading}
                disabled={reorderLoading}
                onDragStart={() => handleDragStart(index)}
                onDragEnd={() => void handleDragEnd()}
                className="p-1 rounded-md text-wibe-secondary shrink-0 opacity-50 group-hover:opacity-100 cursor-grab active:cursor-grabbing disabled:opacity-30 touch-none"
                title="کشیدن برای تغییر ترتیب"
              >
                <GripVertical className="w-4 h-4" />
              </button>

              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  disabled={reorderLoading || index === 0}
                  onClick={() => void moveByStep(index, -1)}
                  className="p-0.5 rounded text-wibe-secondary hover:bg-(--color-bg) disabled:opacity-30"
                  aria-label="جابه‌جایی به بالا"
                  title="بالا"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={reorderLoading || index === items.length - 1}
                  onClick={() => void moveByStep(index, 1)}
                  className="p-0.5 rounded text-wibe-secondary hover:bg-(--color-bg) disabled:opacity-30"
                  aria-label="جابه‌جایی به پایین"
                  title="پایین"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {editingOrderId === item.id ? (
                <input
                  type="number"
                  min={1}
                  max={items.length}
                  dir="ltr"
                  autoFocus
                  value={editingOrderValue}
                  onChange={(e) => setEditingOrderValue(e.target.value)}
                  onBlur={() => void applyNumericOrder(item.id, editingOrderValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void applyNumericOrder(item.id, editingOrderValue);
                    }
                    if (e.key === 'Escape') setEditingOrderId(null);
                  }}
                  disabled={reorderLoading}
                  className="w-12 h-7 rounded border border-(--color-border) bg-(--color-surface) text-center text-xs tabular-nums"
                  aria-label="شماره ترتیب"
                />
              ) : (
                <button
                  type="button"
                  disabled={reorderLoading}
                  onClick={() => {
                    setEditingOrderId(item.id);
                    setEditingOrderValue(String(index + 1));
                  }}
                  className="text-[10px] font-bold text-wibe-secondary w-8 h-7 rounded border border-transparent hover:border-(--color-border) tabular-nums text-center shrink-0"
                  title="تغییر شماره ترتیب"
                >
                  {index + 1}
                </button>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-(--color-text) truncate">{item.title}</p>
                {item.catalogItemId ? (
                  <p className="mt-0.5 truncate text-[10px] text-wibe-secondary" dir="ltr">
                    جایگاه: {item.id.slice(0, 8)}… · کاتالوگ: {item.catalogItemId.slice(0, 8)}…
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Link
                  href={`/admin/items/${item.id}/edit`}
                  className="p-1.5 rounded-lg hover:bg-(--color-bg) text-wibe-secondary"
                  title="ویرایش آیتم"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => void handleRemoveItem(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                  title="حذف از این لیست"
                  aria-label="حذف از این لیست"
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
