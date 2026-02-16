'use client';

import { Plus, Loader2, AlertTriangle } from 'lucide-react';
import DatePicker, { type DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

export type ListOption = {
  id: string;
  title: string;
  slug: string;
  saveCount: number;
  isFeatured?: boolean;
  isActive?: boolean;
  deletedAt?: string | null;
  categories: { name: string; slug: string } | null;
};

export type ConflictResult = {
  conflict: boolean;
  conflictingSlot?: {
    id: string;
    title: string;
    startAt: string;
    endAt: string | null;
  };
} | null;

type Props = {
  lists: ListOption[];
  formCategorySlug: string;
  formListId: string;
  formStartDate: DateObject | null;
  formStartTime: string;
  formEndDate: DateObject | null;
  formEndTime: string;
  conflict: ConflictResult;
  submitLoading: boolean;
  submitError: string | null;
  onCategoryChange: (slug: string) => void;
  onListChange: (id: string) => void;
  onStartDateChange: (d: DateObject | null) => void;
  onStartTimeChange: (v: string) => void;
  onEndDateChange: (d: DateObject | null) => void;
  onEndTimeChange: (v: string) => void;
  onPreset: (preset: 'tomorrow' | 'nextWeek' | 'weekend') => void;
  onSubmit: (e: React.FormEvent) => void;
  formatDate: (s: string) => string;
};

const CATEGORY_NAME_BLOCKLIST = new Set([
  'id', 'slug', 'title', 'categories', 'deletedAt', 'isActive', 'isFeatured', 'isPublic', 'saveCount', 'name',
]);

function isRealCategoryName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const t = name.trim();
  if (CATEGORY_NAME_BLOCKLIST.has(t)) return false;
  if (/^\d+$/.test(t)) return false;
  return t.length >= 2;
}

function toCat(c: ListOption['categories']): { slug: string; name: string } | null {
  if (!c) return null;
  const one = Array.isArray(c) ? c[0] : c;
  const name = (one as { name?: string })?.name;
  const slug = (one as { slug?: string })?.slug;
  return name && slug ? { name, slug } : null;
}

function getCategorySlug(c: ListOption['categories']): string | undefined {
  if (!c) return undefined;
  const one = Array.isArray(c) ? c[0] : c;
  return (one as { slug?: string })?.slug;
}

function getCategoryName(c: ListOption['categories']): string {
  if (!c) return 'بدون دسته';
  return Array.isArray(c) ? (c[0]?.name ?? 'بدون دسته') : (c as { name?: string }).name ?? 'بدون دسته';
}

export default function AddSlotCard({
  lists,
  formCategorySlug,
  formListId,
  formStartDate,
  formStartTime,
  formEndDate,
  formEndTime,
  conflict,
  submitLoading,
  submitError,
  onCategoryChange,
  onListChange,
  onStartDateChange,
  onStartTimeChange,
  onEndDateChange,
  onEndTimeChange,
  onPreset,
  onSubmit,
  formatDate,
}: Props) {
  const categories = Array.from(
    new Map(
      lists
        .map((l) => toCat(l.categories))
        .filter(Boolean)
        .filter((c) => c && isRealCategoryName(c.name))
        .map((c) => [c!.slug, c!])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'fa'));

  const filteredLists =
    formCategorySlug === ''
      ? lists
      : lists.filter((l) => getCategorySlug(l.categories) === formCategorySlug);
  const uniqueLists = filteredLists.filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i);
  const listsByCategory = uniqueLists.reduce<Record<string, ListOption[]>>((acc, l) => {
    const key = getCategoryName(l.categories);
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {});
  const categoryOrder = Object.keys(listsByCategory).sort((a, b) =>
    a === 'بدون دسته' ? 1 : b === 'بدون دسته' ? -1 : a.localeCompare(b, 'fa')
  );

  const hasConflict = conflict?.conflict === true;
  const canSubmit =
    formListId &&
    formStartDate &&
    !submitLoading &&
    !hasConflict;

  return (
    <section
      className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-lg"
      dir="rtl"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        افزودن اسلات
      </h2>

      {lists.length === 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mb-6">
          هیچ لیستی در دیتابیس یافت نشد.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-8 md:grid-cols-2">
          {/* ستون چپ: تاریخ و زمان و preset */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              بازهٔ زمانی
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onPreset('tomorrow')}
                className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                فردا
              </button>
              <button
                type="button"
                onClick={() => onPreset('nextWeek')}
                className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                هفتهٔ بعد
              </button>
              <button
                type="button"
                onClick={() => onPreset('weekend')}
                className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                آخر هفته
              </button>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">شروع</span>
              <div className="flex gap-2 mt-1 flex-wrap">
                <DatePicker
                  value={formStartDate}
                  onChange={(d) => onStartDateChange(d ?? null)}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  format="DD/MM/YYYY"
                  containerClassName="min-w-[140px]"
                  inputClass="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2 w-full text-right"
                  placeholder="تاریخ"
                />
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2"
                  aria-label="ساعت شروع"
                />
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">پایان (اختیاری)</span>
              <div className="flex gap-2 mt-1 flex-wrap">
                <DatePicker
                  value={formEndDate}
                  onChange={(d) => onEndDateChange(d ?? null)}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  format="DD/MM/YYYY"
                  containerClassName="min-w-[140px]"
                  inputClass="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2 w-full text-right"
                  placeholder="تاریخ"
                />
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => onEndTimeChange(e.target.value)}
                  className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2"
                  aria-label="ساعت پایان"
                />
              </div>
            </div>
          </div>

          {/* ستون راست: دسته و لیست */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                دسته‌بندی
              </label>
              <select
                value={formCategorySlug}
                onChange={(e) => {
                  const slug = e.target.value;
                  onCategoryChange(slug);
                  if (formListId) {
                    const nextLists = slug === '' ? lists : lists.filter((l) => getCategorySlug(l.categories) === slug);
                    if (!nextLists.some((l) => l.id === formListId)) onListChange('');
                  }
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2 text-right"
                disabled={lists.length === 0}
              >
                <option value="">همه دسته‌ها</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                لیست
              </label>
              <select
                value={formListId}
                onChange={(e) => onListChange(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2 text-right"
                required
                disabled={lists.length === 0}
              >
                <option value="">
                  {uniqueLists.length === 0 ? '— لیستی در این دسته نیست —' : 'انتخاب لیست'}
                </option>
                {categoryOrder.map((catName) => {
                  const items = listsByCategory[catName] ?? [];
                  return (
                    <optgroup key={catName} label={catName}>
                      {items.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                          {l.isFeatured ? ' [ویژه]' : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* ناحیهٔ تداخل */}
        {hasConflict && conflict?.conflictingSlot && (
          <div className="rounded-2xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                تداخل زمانی با:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                «{conflict.conflictingSlot.title}»
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                بازه: {formatDate(conflict.conflictingSlot.startAt)}
                {conflict.conflictingSlot.endAt
                  ? ` → ${formatDate(conflict.conflictingSlot.endAt)}`
                  : ' → نامحدود'}
              </p>
            </div>
          </div>
        )}

        {submitError && (
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow-md hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:pointer-events-none transition-all"
        >
          {submitLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          افزودن اسلات
        </button>
      </form>
    </section>
  );
}
