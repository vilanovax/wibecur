'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
} from 'lucide-react';
import DatePicker, { type DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import SmartSuggestionsPanel from './SmartSuggestionsPanel';
import FeaturedMobilePreview, { type PreviewList } from './FeaturedMobilePreview';
import type { ListOption, ConflictResult, DurationPreset } from './AddSlotCard';
import { faNumber } from '@/lib/utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  lists: ListOption[];
  listsLoading?: boolean;
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
  onRetryLists?: () => void;
};

function getCategorySlug(c: ListOption['categories']): string | undefined {
  return c?.slug;
}

function getCategoryName(c: ListOption['categories']): string {
  return c?.name ?? 'بدون دسته';
}

function toPreviewList(l: ListOption): PreviewList {
  return {
    title: l.title,
    description: l.description,
    coverImage: l.coverImage,
    saveCount: l.saveCount,
    itemCount: l.itemCount,
    badge: l.badge,
    coverDisplayMode: l.categories?.coverDisplayMode ?? null,
    categorySlug: l.categories?.slug ?? null,
  };
}

export default function AddSlotWizardModal({
  isOpen,
  onClose,
  lists,
  listsLoading = false,
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
  onRetryLists,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [listSearch, setListSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState<DurationPreset | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setListSearch('');
      setShowAdvanced(false);
      setActivePreset(null);
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>();
    for (const l of lists) {
      if (l.categories?.slug && l.categories.name) {
        map.set(l.categories.slug, {
          slug: l.categories.slug,
          name: l.categories.name,
        });
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
  const canGoStep2 = !!formListId;
  const canSubmit = formListId && formStartDate && !submitLoading && !hasConflict;

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const applyPreset = (preset: DurationPreset) => {
    setActivePreset(preset);
    onPreset(preset);
    if (preset !== 'open') setShowAdvanced(false);
  };

  const pickList = (id: string) => {
    onListChange(id);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-slot-wizard-title"
      dir="rtl"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-(--color-border) px-4 py-3">
          <div>
            <h2
              id="add-slot-wizard-title"
              className="text-lg font-bold leading-snug text-(--color-text)"
            >
              زمان‌بندی اسلات جدید
            </h2>
            <p className="mt-1 text-sm text-wibe-secondary">
              مرحله {faNumber(step)} از {faNumber(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-(--color-bg)"
            aria-label="بستن"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex gap-2" role="tablist" aria-label="مراحل جادوگر">
              <button
                type="button"
                role="tab"
                aria-selected={step === 1}
                onClick={() => setStep(1)}
                className={`min-h-11 flex-1 rounded-xl text-sm font-medium ${
                  step === 1
                    ? 'bg-primary text-white'
                    : 'bg-(--color-bg) text-wibe-secondary'
                }`}
              >
                ۱. انتخاب لیست
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={step === 2}
                disabled={!canGoStep2}
                onClick={() => canGoStep2 && setStep(2)}
                className={`min-h-11 flex-1 rounded-xl text-sm font-medium disabled:opacity-40 ${
                  step === 2
                    ? 'bg-primary text-white'
                    : 'bg-(--color-bg) text-wibe-secondary'
                }`}
              >
                ۲. بازه زمانی
              </button>
            </div>

            {step === 1 ? (
              <>
                <SmartSuggestionsPanel
                  onPickList={(id) => {
                    onListChange(id);
                    setStep(2);
                  }}
                />

                <div className="flex flex-wrap gap-2">
                  <select
                    value={formCategorySlug}
                    aria-label="فیلتر دسته"
                    onChange={(e) => {
                      const slug = e.target.value;
                      onCategoryChange(slug);
                      if (formListId) {
                        const ok = (
                          slug === ''
                            ? lists
                            : lists.filter(
                                (l) => getCategorySlug(l.categories) === slug
                              )
                        ).some((l) => l.id === formListId);
                        if (!ok) onListChange('');
                      }
                    }}
                    className="min-h-11 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm text-(--color-text)"
                  >
                    <option value="">همه دسته‌ها</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative min-w-0 flex-1 basis-48">
                    <Search
                      className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-wibe-secondary"
                      strokeWidth={1.5}
                    />
                    <input
                      type="search"
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                      placeholder="جستجوی عنوان یا دسته"
                      className="min-h-11 w-full rounded-xl border border-(--color-border) bg-(--color-surface) pe-3 ps-10 text-sm text-(--color-text) placeholder:text-wibe-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-(--color-text)">
                    انتخاب لیست
                    <span className="ms-2 font-normal text-wibe-secondary">
                      {faNumber(filteredLists.length)} مورد
                    </span>
                  </p>
                  {listsLoading ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-(--color-border) bg-(--color-bg) px-4 py-10">
                      <Loader2
                        className="size-6 animate-spin text-primary"
                        strokeWidth={1.5}
                      />
                      <p className="text-sm text-wibe-secondary">در حال بارگذاری لیست‌ها…</p>
                    </div>
                  ) : filteredLists.length === 0 ? (
                    <div className="space-y-3 rounded-xl border border-(--color-border) bg-(--color-bg) px-4 py-8 text-center">
                      <p className="text-sm text-wibe-secondary">
                        لیستی با این فیلتر یافت نشد.
                      </p>
                      {onRetryLists ? (
                        <button
                          type="button"
                          onClick={onRetryLists}
                          className="inline-flex min-h-11 items-center rounded-xl border border-(--color-border) bg-(--color-surface) px-4 text-sm hover:bg-(--color-bg)"
                        >
                          تلاش دوباره
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <ul
                      className="max-h-72 space-y-2 overflow-y-auto pe-1"
                      role="listbox"
                      aria-label="لیست‌ها"
                    >
                      {filteredLists.map((l) => {
                        const selected = l.id === formListId;
                        return (
                          <li key={l.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => pickList(l.id)}
                              onDoubleClick={() => {
                                pickList(l.id);
                                setStep(2);
                              }}
                              className={`flex w-full min-h-14 items-center gap-3 rounded-xl border p-2 text-start transition-colors ${
                                selected
                                  ? 'border-primary bg-primary/10'
                                  : 'border-(--color-border) bg-(--color-surface) hover:bg-(--color-bg)'
                              }`}
                            >
                              <div className="relative aspect-square size-12 shrink-0 overflow-hidden rounded-lg bg-(--color-bg)">
                                <ImageWithFallback
                                  src={l.coverImage ?? ''}
                                  alt=""
                                  className="size-full object-cover"
                                  fallbackIcon="🎬"
                                  fallbackClassName="size-full"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-(--color-text)">
                                  {l.title}
                                  {l.isFeatured ? ' ★' : ''}
                                </p>
                                <p className="mt-1 truncate text-sm text-wibe-secondary">
                                  {getCategoryName(l.categories)}
                                  {' · '}
                                  {faNumber(l.saveCount)} ذخیره
                                </p>
                              </div>
                              {selected ? (
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                  <Check className="size-4" strokeWidth={2} />
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {selectedList ? (
                    <p className="mt-2 text-sm text-wibe-secondary">
                      انتخاب‌شده:{' '}
                      <strong className="text-(--color-text)">
                        {selectedList.title}
                      </strong>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-wibe-secondary">
                      یک لیست را انتخاب کنید تا پیش‌نمایش سمت چپ به‌روز شود.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <form id="slot-wizard-form" onSubmit={onSubmit} className="space-y-4">
                {selectedList && (
                  <div className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-bg) p-3">
                    <div className="relative aspect-square size-12 shrink-0 overflow-hidden rounded-lg">
                      <ImageWithFallback
                        src={selectedList.coverImage ?? ''}
                        alt=""
                        className="size-full object-cover"
                        fallbackIcon="🎬"
                        fallbackClassName="size-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-(--color-text)">
                        {selectedList.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="mt-1 text-sm text-primary hover:underline"
                      >
                        تغییر لیست
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm font-medium text-(--color-text)">
                    بازه نمایش
                  </p>
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
                        className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium ${
                          activePreset === id
                            ? 'border-primary bg-primary text-white'
                            : 'border-(--color-border) text-(--color-text) hover:bg-(--color-bg)'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {formStartDate && (
                  <p className="rounded-xl bg-(--color-bg) px-3 py-2 text-sm text-wibe-secondary">
                    شروع: {formStartDate.format?.('DD MMMM YYYY') ?? '—'}
                    {formEndDate
                      ? ` · پایان: ${formEndDate.format?.('DD MMMM YYYY') ?? '—'}`
                      : ' · بدون پایان'}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="min-h-11 text-sm text-primary hover:underline"
                >
                  {showAdvanced ? 'بستن تنظیم دستی' : 'تنظیم دستی تاریخ و ساعت'}
                </button>

                {showAdvanced && (
                  <div className="grid gap-3 rounded-xl bg-(--color-bg) p-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-wibe-secondary">شروع</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <DatePicker
                          value={formStartDate}
                          onChange={(d) => {
                            onStartDateChange(d ?? null);
                            setActivePreset(null);
                          }}
                          calendar={persian}
                          locale={persian_fa}
                          inputClass="min-h-11 rounded-xl border border-(--color-border) px-3 text-sm"
                        />
                        <input
                          type="time"
                          value={formStartTime}
                          onChange={(e) => onStartTimeChange(e.target.value)}
                          className="min-h-11 rounded-xl border border-(--color-border) px-3 text-sm"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-wibe-secondary">پایان</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <DatePicker
                          value={formEndDate}
                          onChange={(d) => {
                            onEndDateChange(d ?? null);
                            setActivePreset(null);
                          }}
                          calendar={persian}
                          locale={persian_fa}
                          inputClass="min-h-11 rounded-xl border border-(--color-border) px-3 text-sm"
                        />
                        <input
                          type="time"
                          value={formEndTime}
                          onChange={(e) => onEndTimeChange(e.target.value)}
                          className="min-h-11 rounded-xl border border-(--color-border) px-3 text-sm"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hasConflict && conflict?.conflictingSlot && (
                  <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <AlertTriangle className="size-4 shrink-0" strokeWidth={1.5} />
                    <div>
                      تداخل با «{conflict.conflictingSlot.title}»
                      <span className="mt-1 block text-sm">
                        {formatDate(conflict.conflictingSlot.startAt)}
                        {conflict.conflictingSlot.endAt
                          ? ` – ${formatDate(conflict.conflictingSlot.endAt)}`
                          : ''}
                      </span>
                    </div>
                  </div>
                )}
                {submitError && (
                  <p className="text-sm text-red-700">{submitError}</p>
                )}
              </form>
            )}
          </div>

          <div className="hidden w-72 shrink-0 border-s border-(--color-border) bg-(--color-bg) p-4 lg:block">
            <FeaturedMobilePreview
              list={selectedList ? toPreviewList(selectedList) : null}
              mode="preview"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-(--color-border) px-4 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-11 items-center rounded-xl border border-(--color-border) px-4 text-sm"
          >
            انصراف
          </button>
          <div className="flex gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-(--color-border) px-4 text-sm"
              >
                <ChevronRight className="size-4" strokeWidth={1.5} />
                قبلی
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                بعدی
                <ChevronLeft className="size-4" strokeWidth={1.5} />
              </button>
            ) : (
              <button
                type="submit"
                form="slot-wizard-form"
                disabled={!canSubmit}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitLoading && (
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
                )}
                ثبت اسلات
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
