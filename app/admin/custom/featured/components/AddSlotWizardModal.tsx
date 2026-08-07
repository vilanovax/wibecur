'use client';

import { useState, useMemo } from 'react';
import { X, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import DatePicker, { type DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import SmartSuggestionsPanel from './SmartSuggestionsPanel';
import FeaturedMobilePreview, { type PreviewList } from './FeaturedMobilePreview';
import type { ListOption, ConflictResult, DurationPreset } from './AddSlotCard';

type Props = {
  isOpen: boolean;
  onClose: () => void;
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
  };
}

export default function AddSlotWizardModal({
  isOpen,
  onClose,
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
  const [step, setStep] = useState<1 | 2>(1);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--color-border)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">زمان‌بندی اسلات جدید</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              مرحله {step.toLocaleString('fa-IR')} از ۲
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-[var(--color-bg)]"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex gap-2">
              <span
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                  step === 1 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                }`}
              >
                ۱. انتخاب لیست
              </span>
              <span
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                  step === 2 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                }`}
              >
                ۲. بازه زمانی
              </span>
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
                    onChange={(e) => {
                      const slug = e.target.value;
                      onCategoryChange(slug);
                      if (formListId) {
                        const ok = (slug === '' ? lists : lists.filter((l) => getCategorySlug(l.categories) === slug)).some(
                          (l) => l.id === formListId
                        );
                        if (!ok) onListChange('');
                      }
                    }}
                    className="rounded-xl border border-[var(--color-border)] text-sm px-3 py-2"
                  >
                    <option value="">همه دسته‌ها</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                      type="search"
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                      placeholder="جستجو..."
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-[var(--color-border)] text-sm"
                    />
                  </div>
                </div>
                <select
                  value={formListId}
                  onChange={(e) => onListChange(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] text-sm px-3 py-2.5"
                  size={Math.min(8, Math.max(4, filteredLists.length))}
                >
                  <option value="">
                    {filteredLists.length === 0 ? 'لیستی یافت نشد' : 'انتخاب لیست'}
                  </option>
                  {filteredLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                      {l.isFeatured ? ' ★' : ''} · {getCategoryName(l.categories)}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <form id="slot-wizard-form" onSubmit={onSubmit} className="space-y-4">
                {selectedList && (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    لیست: <strong className="text-[var(--color-text)]">{selectedList.title}</strong>
                  </p>
                )}
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
                      className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                        activePreset === id
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'border-[var(--color-border)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {formStartDate && (
                  <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] rounded-lg px-3 py-2">
                    شروع: {formStartDate.format?.('DD MMMM YYYY') ?? '—'}
                    {formEndDate ? ` · پایان: ${formEndDate.format?.('DD MMMM YYYY') ?? '—'}` : ' · بدون پایان'}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="text-xs text-[var(--primary)]"
                >
                  {showAdvanced ? 'بستن تنظیم دستی' : 'تنظیم دستی تاریخ'}
                </button>
                {showAdvanced && (
                  <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--color-bg)]">
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)]">شروع</label>
                      <div className="flex gap-2 mt-1">
                        <DatePicker
                          value={formStartDate}
                          onChange={(d) => {
                            onStartDateChange(d ?? null);
                            setActivePreset(null);
                          }}
                          calendar={persian}
                          locale={persian_fa}
                          inputClass="rounded-xl border border-[var(--color-border)] text-sm px-2 py-1.5 w-full"
                        />
                        <input
                          type="time"
                          value={formStartTime}
                          onChange={(e) => onStartTimeChange(e.target.value)}
                          className="rounded-xl border border-[var(--color-border)] text-sm px-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)]">پایان</label>
                      <div className="flex gap-2 mt-1">
                        <DatePicker
                          value={formEndDate}
                          onChange={(d) => {
                            onEndDateChange(d ?? null);
                            setActivePreset(null);
                          }}
                          calendar={persian}
                          locale={persian_fa}
                          inputClass="rounded-xl border border-[var(--color-border)] text-sm px-2 py-1.5 w-full"
                        />
                        <input
                          type="time"
                          value={formEndTime}
                          onChange={(e) => onEndTimeChange(e.target.value)}
                          className="rounded-xl border border-[var(--color-border)] text-sm px-2"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {hasConflict && conflict?.conflictingSlot && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 p-3 flex gap-2 text-sm text-red-800 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <div>
                      تداخل با «{conflict.conflictingSlot.title}»
                      <span className="block text-xs mt-0.5">
                        {formatDate(conflict.conflictingSlot.startAt)}
                        {conflict.conflictingSlot.endAt
                          ? ` – ${formatDate(conflict.conflictingSlot.endAt)}`
                          : ''}
                      </span>
                    </div>
                  </div>
                )}
                {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}
              </form>
            )}
          </div>

          <div className="hidden lg:block w-[300px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <FeaturedMobilePreview
              list={selectedList ? toPreviewList(selectedList) : null}
              mode="preview"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-[var(--color-border)] shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm"
          >
            انصراف
          </button>
          <div className="flex gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm"
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm disabled:opacity-50"
              >
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                form="slot-wizard-form"
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm disabled:opacity-50"
              >
                {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                ثبت اسلات
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
