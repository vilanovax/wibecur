'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArchiveRestore, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

type TrashCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  deletedAt: string;
  deleteReason: string | null;
  _count?: { lists: number };
};

export default function CategoryTrashPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TrashCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories?trash=true&includeInactive=true');
      if (!res.ok) throw new Error('خطا در بارگذاری زباله‌دان');
      const data = (await res.json()) as TrashCategory[];
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadTrash();
  }, [open, loadTrash]);

  const handleRestore = async (id: string, name: string) => {
    if (!window.confirm(`بازگردانی «${name}» از زباله‌دان؟`)) return;
    setActionId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}/restore`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در بازگردانی');
      setMessage(`«${name}» بازگردانی شد`);
      await loadTrash();
      router.refresh();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'خطا');
    } finally {
      setActionId(null);
    }
  };

  return (
    <section
      className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden"
      dir="rtl"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-right hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-gray-500" />
          <span className="font-semibold text-gray-900 dark:text-white">زباله‌دان دسته‌ها</span>
          {items.length > 0 && open && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 tabular-nums">
              {items.length.toLocaleString('fa-IR')}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">در حال بارگذاری...</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              زباله‌دان خالی است.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 mt-3 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              {items.map((cat) => (
                <li
                  key={cat.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50/50 dark:bg-gray-900/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{cat.icon || '📁'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{cat.name}</p>
                      <p className="text-xs text-gray-500 font-mono" dir="ltr">
                        {cat.slug}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        حذف:{' '}
                        {new Date(cat.deletedAt).toLocaleDateString('fa-IR', {
                          dateStyle: 'medium',
                        })}
                        {cat._count?.lists != null && (
                          <> · {cat._count.lists.toLocaleString('fa-IR')} لیست</>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={actionId === cat.id}
                    onClick={() => handleRestore(cat.id, cat.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 disabled:opacity-50"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                    بازگردانی
                  </button>
                </li>
              ))}
            </ul>
          )}
          {message && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
