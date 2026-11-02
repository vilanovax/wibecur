'use client';

import { AlertCircle, Plus, ExternalLink, Pencil, Trash2 } from 'lucide-react';
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
        className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"
        dir="rtl"
      >
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-sm font-medium text-emerald-800">
              الان در هوم اپ
            </p>
            <h2 className="text-lg font-bold leading-snug text-(--color-text)">
              {current.list.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-wibe-secondary">
              {[
                catName,
                current.endAt
                  ? `${formatDate(current.startAt)} → ${formatDate(current.endAt)}`
                  : formatDate(current.startAt),
                remainingText && remainingText !== 'نامحدود'
                  ? remainingText
                  : !current.endAt
                    ? 'نامحدود'
                    : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/lists/${current.list.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm hover:bg-(--color-bg)"
            >
              <ExternalLink className="size-4" strokeWidth={1.5} />
              لیست
            </a>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm hover:bg-(--color-bg)"
            >
              <Pencil className="size-4" strokeWidth={1.5} />
              زمان
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-red-700 hover:bg-red-50"
            >
              <Trash2 className="size-4" strokeWidth={1.5} />
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
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus className="size-4" strokeWidth={2} />
        زمان‌بندی منتخب
      </button>
    </div>
  );
}
