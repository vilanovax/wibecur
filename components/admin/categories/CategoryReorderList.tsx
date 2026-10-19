'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, Save } from 'lucide-react';
import Toast from '@/components/shared/Toast';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';

interface CategoryReorderListProps {
  categories: CategoryIntelligenceRow[];
}

export default function CategoryReorderList({ categories }: CategoryReorderListProps) {
  const router = useRouter();
  const sortedInitial = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'fa')),
    [categories]
  );

  const [items, setItems] = useState(sortedInitial);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(
      [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'fa'))
    );
    setDirty(false);
  }, [categories]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dirty, setDirty] = useState(false);

  const moveItem = useCallback((from: number, to: number) => {
    if (from === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
    setDirty(true);
  }, []);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    moveItem(dragIndex, index);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: items.map((c) => c.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره');
      setDirty(false);
      setToast({ message: 'ترتیب با موفقیت ذخیره شد', type: 'success' });
      router.refresh();
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'خطا در ذخیره',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        دسته‌ها را بکشید و رها کنید تا ترتیب نمایش در اپ تغییر کند. این ترتیب روی{' '}
        <strong>همه دسته‌ها</strong> اعمال می‌شود (مستقل از فیلتر جستجو).
      </div>

      <ul className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
        {items.map((cat, index) => (
          <li
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing transition-colors ${
              dragIndex === index ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
          >
            <GripVertical className="w-5 h-5 text-[var(--color-text-subtle)] shrink-0" aria-hidden />
            <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] tabular-nums shrink-0">
              {(index + 1).toLocaleString('fa-IR')}
            </span>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{
                backgroundColor: cat.color ? `${cat.color}20` : undefined,
              }}
            >
              {cat.icon || '📁'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--color-text)] dark:text-white truncate">{cat.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] font-mono truncate" dir="ltr">
                {cat.slug}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-lg shrink-0 ${
                cat.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'bg-gray-100 text-[var(--color-text-muted)]'
              }`}
            >
              {cat.isActive ? 'فعال' : 'غیرفعال'}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !dirty}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {loading ? 'در حال ذخیره...' : 'ذخیره ترتیب'}
        </button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={3500} />
      )}
    </div>
  );
}
