'use client';

import { useState, useMemo } from 'react';
import { Plus, Loader2, AlertTriangle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import DatePicker, { type DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

export type ListOption = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  saveCount: number;
  itemCount?: number;
  badge?: string | null;
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

export type DurationPreset = 'tomorrow' | 'week7' | 'weekend' | 'open';

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
  onPreset: (preset: DurationPreset) => void;
  onSubmit: (e: React.FormEvent) => void;
  formatDate: (s: string) => string;
  formRef?: React.RefObject<HTMLDivElement | null>;
};

function getCategorySlug(c: ListOption['categories']): string | undefined {
  return c?.slug;
}

function getCategoryName(c: ListOption['categories']): string {
  return c?.name ?? 'بدون دسته';
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
  formRef,
}: Props) {
  const [listSearch, setListSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState<DurationPreset | null>(null);

  const categories = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>();
    for (const l of lists) {
      if (l.categories?.slug && l.categories.name) {
        map.set(l.categories.slug, { slug: l.categories.slug, name: l.categories.name });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  }, [lists]);

  const filteredLists = useMemo(() => {
    let result =
      formCategorySlug === ''
        ? lists
        : lists.filter((l) => getCategorySlug(l.categories) === formCategorySlug);
    const q = listSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.slug.toLowerCase().includes(q) ||
          getCategoryName(l.categories).toLowerCase().includes(q)
      );
    }
    return result;
  }, [lists, formCategorySlug, listSearch]);

  const selectedList = lists.find((l) => l.id === formListId);
  const hasConflict = conflict?.conflict === true;
  const canSubmit = formListId && formStartDate && !submitLoading && !hasConflict;

  const applyPreset = (preset: DurationPreset) => {
    setActivePreset(preset);
    onPreset(preset);
    if (preset !== 'open') setShowAdvanced(false);
  };

  return (
    <section
      ref={formRef}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm scroll-mt-24"
      dir="rtl"
      id="add-featured-slot"
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[var(--color-text)]">افزودن اسلات</h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          لیست را انتخاب کنید، بازه را مشخص کنید — ساعت دقیق اختیاری است.
        </p>
      </div>

      {lists.length === 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-xl p-3 mb-4">
          لیستی برای انتخاب وجود ندارد.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* ۱. لیست */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-[var(--color-text)]">۱. انتخاب لیست</span>
          <div className="flex flex-wrap gap-2">
            <select
              value={formCategorySlug}
              onChange={(e) => {
                onCategoryChange(e.target.value);
                if (formListId) {
                  const slug = e.target.value;
                  const ok = (slug === '' ? lists : lists.filter((l) => getCategorySlug(l.categories) === slug)).some(
                    (l) => l.id === formListId
                  );
                  if (!ok) onListChange('');
                }
              }}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm px-3 py-2 min-w-[140px]"
              disabled={lists.length === 0}
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="search"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="جستجو عنوان لیست..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-[var(--color-border)] text-sm"
              />
            </div>
          </div>
          <select
            value={formListId}
            onChange={(e) => onListChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm px-3 py-2.5"
            required
            disabled={lists.length === 0 || filteredLists.length === 0}
          >
            <option value="">
              {filteredLists.length === 0 ? 'لیستی یافت نشد' : 'یک لیست انتخاب کنید'}
            </option>
            {filteredLists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
                {l.isFeatured ? ' ★' : ''} · {getCategoryName(l.categories)} ·{' '}
                {l.saveCount.toLocaleString('fa-IR')} ذخیره
              </option>
            ))}
          </select>
          {selectedList && (
            <p className="text-xs text-[var(--color-text-muted)]">
              انتخاب‌شده: <strong className="text-[var(--color-text)]">{selectedList.title}</strong>
            </p>
          )}
        </div>

        {/* ۲. بازه */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-[var(--color-text)]">۲. بازه نمایش</span>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'tomorrow' as const, label: 'فردا' },
                { id: 'week7' as const, label: '۷ روز' },
                { id: 'weekend' as const, label: 'آخر هفته' },
                { id: 'open' as const, label: 'بدون پایان' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => applyPreset(id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  activePreset === id
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {formStartDate && (
            <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] rounded-lg px-3 py-2">
              شروع: {formStartDate.format?.('DD MMMM YYYY') ?? '—'}
              {formEndDate
                ? ` · پایان: ${formEndDate.format?.('DD MMMM YYYY') ?? '—'}`
                : ' · بدون تاریخ پایان'}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAdvanced ? 'بستن تنظیم تاریخ و ساعت' : 'تنظیم دستی تاریخ و ساعت'}
          </button>

          {showAdvanced && (
            <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-bg)]">
              <div>
                <label className="text-xs text-[var(--color-text-muted)]">شروع</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <DatePicker
                    value={formStartDate}
                    onChange={(d) => {
                      onStartDateChange(d ?? null);
                      setActivePreset(null);
                    }}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    inputClass="rounded-xl border border-[var(--color-border)] text-sm px-3 py-2 w-full text-right bg-[var(--color-surface)]"
                    placeholder="تاریخ"
                  />
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => onStartTimeChange(e.target.value)}
                    className="rounded-xl border border-[var(--color-border)] text-sm px-3 py-2 bg-[var(--color-surface)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)]">پایان (اختیاری)</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <DatePicker
                    value={formEndDate}
                    onChange={(d) => {
                      onEndDateChange(d ?? null);
                      setActivePreset(null);
                    }}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    inputClass="rounded-xl border border-[var(--color-border)] text-sm px-3 py-2 w-full text-right bg-[var(--color-surface)]"
                    placeholder="تاریخ"
                  />
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => onEndTimeChange(e.target.value)}
                    className="rounded-xl border border-[var(--color-border)] text-sm px-3 py-2 bg-[var(--color-surface)]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {hasConflict && conflict?.conflictingSlot && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2 text-sm text-red-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">تداخل با «{conflict.conflictingSlot.title}»</p>
              <p className="text-xs mt-0.5 opacity-90">
                {formatDate(conflict.conflictingSlot.startAt)}
                {conflict.conflictingSlot.endAt
                  ? ` – ${formatDate(conflict.conflictingSlot.endAt)}`
                  : ' – نامحدود'}
              </p>
            </div>
          </div>
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--primary)] text-white font-medium disabled:opacity-50"
        >
          {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          ثبت اسلات
        </button>
      </form>
    </section>
  );
}
