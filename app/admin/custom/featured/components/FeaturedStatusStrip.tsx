'use client';

import { AlertCircle, Plus, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { fa, faNumber } from '@/lib/utils';
import type { SlotItem } from '../FeaturedManagementClient';
import type { FeaturedSlotPerformance } from '@/lib/admin/featured-management-types';

type Props = {
  current: SlotItem | null;
  fallbackList: { id: string; title: string; slug: string } | null;
  formatDate: (s: string) => string;
  remainingText: string | null;
  performance?: FeaturedSlotPerformance | null;
  onEdit: () => void;
  onRemove: () => void;
  onAddClick: () => void;
};

function formatPct(n: number): string {
  return `${fa(n.toFixed(1).replace('.', '٫'))}٪`;
}

export default function FeaturedStatusStrip({
  current,
  fallbackList,
  formatDate,
  remainingText,
  performance = null,
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

    const hasMetrics =
      !!performance &&
      (performance.impressions > 0 ||
        performance.clicks > 0 ||
        performance.savesDuring > 0);

    return (
      <article
        className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70"
        dir="rtl"
      >
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-(--color-bg) sm:aspect-square sm:w-28">
            <ImageWithFallback
              src={current.list.coverImage ?? ''}
              alt={current.list.title}
              className="size-full object-cover"
              fallbackIcon="🎬"
              fallbackClassName="size-full"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium text-emerald-800">
                الان در هوم اپ
                {remainingText ? (
                  <span className="font-normal text-emerald-800/80">
                    {' '}
                    · {remainingText}
                  </span>
                ) : null}
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
                  !current.endAt ? 'نامحدود' : null,
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
        </div>

        {hasMetrics && performance ? (
          <div className="grid grid-cols-2 gap-px border-t border-emerald-200/80 bg-emerald-200/60 sm:grid-cols-4">
            <div className="bg-emerald-50/90 px-3 py-3">
              <p className="text-sm text-emerald-900/70">نمایش</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-(--color-text)">
                {faNumber(performance.impressions)}
              </p>
            </div>
            <div className="bg-emerald-50/90 px-3 py-3">
              <p className="text-sm text-emerald-900/70">کلیک</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-(--color-text)">
                {faNumber(performance.clicks)}
              </p>
            </div>
            <div className="bg-emerald-50/90 px-3 py-3">
              <p className="text-sm text-emerald-900/70">نرخ کلیک</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-amber-800">
                {formatPct(performance.ctr * 100)}
              </p>
            </div>
            <div className="bg-emerald-50/90 px-3 py-3">
              <p className="text-sm text-emerald-900/70">ذخیره</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-(--color-text)">
                {faNumber(performance.savesDuring)}
              </p>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
      dir="rtl"
    >
      <div className="flex min-w-0 gap-3">
        <AlertCircle className="mt-1 size-5 shrink-0 text-amber-700" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-amber-900">
            اسلات زمان‌بندی‌شده فعال نیست
          </p>
          <p className="mt-1 text-sm text-amber-900/80">
            {fallbackList ? (
              <>
                فعلاً لیست ویژه{' '}
                <strong className="text-amber-950">{fallbackList.title}</strong> در هوم
                نمایش داده می‌شود.
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
