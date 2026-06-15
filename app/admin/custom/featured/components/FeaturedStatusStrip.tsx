'use client';

import { Sparkles, AlertCircle, Plus, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { SlotItem } from '../FeaturedManagementClient';

type Props = {
  current: SlotItem | null;
  fallbackList: { id: string; title: string; slug: string } | null;
  formatDate: (s: string) => string;
  remainingText: string | null;
  onEdit: () => void;
  onRemove: () => void;
  onAddClick: () => void;
};

export default function FeaturedStatusStrip({
  current,
  fallbackList,
  formatDate,
  remainingText,
  onEdit,
  onRemove,
  onAddClick,
}: Props) {
  if (current) {
    const catName =
      current.list.categories &&
      typeof current.list.categories === 'object' &&
      !Array.isArray(current.list.categories)
        ? (current.list.categories as { name?: string }).name
        : null;

    return (
      <article
        className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-gradient-to-l from-emerald-50/90 to-[var(--color-surface)] p-5 shadow-sm"
        dir="rtl"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">الان در هوم اپ</p>
              <h2 className="text-lg font-bold text-[var(--color-text)] truncate">
                {current.list.title}
              </h2>
              <div className="flex flex-wrap gap-2 mt-1 text-sm text-[var(--color-text-muted)]">
                {catName && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs">
                    {catName}
                  </span>
                )}
                <span>
                  {formatDate(current.startAt)}
                  {current.endAt ? ` → ${formatDate(current.endAt)}` : ' → نامحدود'}
                </span>
                {remainingText && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">· {remainingText}</span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-subtle)] mt-1">
                {current.viewListCount.toLocaleString('fa-IR')} مشاهده ·{' '}
                {current.quickSaveCount.toLocaleString('fa-IR')} ذخیره سریع
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href={`/lists/${current.list.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg)]"
            >
              <ExternalLink className="w-4 h-4" />
              لیست
            </a>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg)]"
            >
              <Pencil className="w-4 h-4" />
              زمان
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div
      className="rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-900/20 p-5 flex flex-wrap items-center justify-between gap-4"
      dir="rtl"
    >
      <div className="flex gap-3 min-w-0">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">اسلات زمان‌بندی‌شده فعال نیست</p>
          <p className="text-sm text-amber-800/90 dark:text-amber-300 mt-1">
            {fallbackList ? (
              <>
                فعلاً لیست ویژه{' '}
                <strong className="text-amber-950">{fallbackList.title}</strong> در هوم نمایش داده
                می‌شود.
              </>
            ) : (
              <>هیچ لیست «ویژه»ای تعریف نشده — از مدیریت لیست‌ها یکی را ویژه کنید.</>
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 shrink-0"
      >
        <Plus className="w-4 h-4" />
        زمان‌بندی منتخب
      </button>
    </div>
  );
}
