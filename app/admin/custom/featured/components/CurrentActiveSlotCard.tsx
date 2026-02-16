'use client';

import { Pencil, Trash2, ExternalLink } from 'lucide-react';

export type SlotItem = {
  id: string;
  listId: string;
  list: {
    id: string;
    title: string;
    slug: string;
    saveCount: number;
    categories?: { name: string; slug: string } | null;
  };
  startAt: string;
  endAt: string | null;
  orderIndex: number;
  viewListCount: number;
  quickSaveCount: number;
};

type Props = {
  slot: SlotItem;
  formatDate: (s: string) => string;
  remainingText: string | null;
  onEdit: () => void;
  onRemove: () => void;
};

export default function CurrentActiveSlotCard({
  slot,
  formatDate,
  remainingText,
  onEdit,
  onRemove,
}: Props) {
  const catName = slot.list.categories && typeof slot.list.categories === 'object' && !Array.isArray(slot.list.categories)
    ? (slot.list.categories as { name?: string }).name
    : null;

  return (
    <article
      className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden transition-shadow"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-48 h-36 sm:h-auto bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 flex items-center justify-center shrink-0">
          <span className="text-4xl opacity-40">⭐</span>
        </div>
        <div className="flex-1 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {slot.list.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {catName && (
                <span className="inline-flex px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-xs font-medium text-indigo-800 dark:text-indigo-200">
                  {catName}
                </span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ذخیره: {slot.list.saveCount}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              بازه: {formatDate(slot.startAt)}
              {slot.endAt ? ` → ${formatDate(slot.endAt)}` : ' → نامحدود'}
            </p>
            {remainingText && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2">
                {remainingText}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              مشاهده: {slot.viewListCount} · ذخیره سریع: {slot.quickSaveCount}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/lists/${slot.list.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              مشاهده لیست
            </a>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-sm font-medium text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              ویرایش زمان‌بندی
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
