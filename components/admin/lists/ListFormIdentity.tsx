'use client';

import { Loader2, RefreshCw, Sparkles, Wand2, Zap } from 'lucide-react';
import { isValidListSlug } from '@/lib/admin/list-slug';
import type { SlugCheckState } from '@/hooks/useListSlugCheck';

export type ListIdentityValues = {
  title: string;
  slug: string;
  description: string;
  categoryId: string;
};

type CategoryOption = {
  id: string;
  name: string;
  icon: string;
  slug?: string;
  isActive?: boolean;
};

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--primary)]';

interface ListFormIdentityProps {
  values: ListIdentityValues;
  categories: CategoryOption[];
  onChange: (patch: Partial<ListIdentityValues>) => void;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  slugAutoMode?: boolean;
  onResetSlugAuto?: () => void;
  slugCheck?: SlugCheckState;
  onApplySlugSuggestion?: (slug: string) => void;
  /** دکمه‌های تکمیل سریع (صفحه لیست جدید / ویرایش) */
  showQuickActions?: boolean;
  onGenerateSlug?: () => void;
  generatingSlug?: boolean;
  onGenerateDescription?: () => void;
  generatingDescription?: boolean;
  onQuickFill?: () => void;
  quickFillLoading?: boolean;
}

export default function ListFormIdentity({
  values,
  categories,
  onChange,
  onTitleChange,
  onSlugChange,
  slugAutoMode = false,
  onResetSlugAuto,
  slugCheck,
  onApplySlugSuggestion,
  showQuickActions = false,
  onGenerateSlug,
  generatingSlug = false,
  onGenerateDescription,
  generatingDescription = false,
  onQuickFill,
  quickFillLoading = false,
}: ListFormIdentityProps) {
  const slugValid = values.slug.length > 0 && isValidListSlug(values.slug);
  const canQuickFill = values.title.trim().length > 0 && !!values.categoryId;
  const quickBusy = generatingSlug || generatingDescription || quickFillLoading;
  const hasInactiveCategories = categories.some((c) => c.isActive === false);
  const selectedInactive =
    categories.find((c) => c.id === values.categoryId)?.isActive === false;

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <label htmlFor="list-title" className="block text-sm font-medium text-[var(--color-text)] mb-1">
          عنوان لیست *
        </label>
        <input
          id="list-title"
          type="text"
          value={values.title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          className={inputClass}
          placeholder="مثلاً: فیلم‌هایی که بعد از دیدنشان ساکت می‌مانی"
        />
      </div>

      <div>
        <label htmlFor="list-category" className="block text-sm font-medium text-[var(--color-text)] mb-1">
          دسته‌بندی *
        </label>
        <select
          id="list-category"
          value={values.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          required
          className={inputClass}
        >
          {categories.length === 0 ? (
            <option value="">دسته‌ای یافت نشد</option>
          ) : (
            categories.map((c) => {
              const inactive = c.isActive === false;
              return (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                  {inactive ? ' (غیرفعال)' : ''}
                </option>
              );
            })
          )}
        </select>
        {hasInactiveCategories && (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            دسته‌های فعال و غیرفعال هر دو در لیست هستند.
            {selectedInactive ? ' دسته انتخاب‌شده فعلاً در اپ عمومی پنهان است.' : ''}
          </p>
        )}
      </div>

      {showQuickActions && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 space-y-2">
          <p className="text-xs font-semibold text-[var(--color-text)]">تکمیل سریع</p>
          <div className="flex flex-wrap gap-2">
            {onQuickFill && (
              <button
                type="button"
                disabled={!canQuickFill || quickBusy}
                onClick={onQuickFill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {quickFillLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                Slug + توضیحات AI
              </button>
            )}
            {onGenerateSlug && (
              <button
                type="button"
                disabled={!values.title.trim() || generatingSlug || quickFillLoading}
                onClick={onGenerateSlug}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-xs font-semibold hover:bg-[var(--color-border-muted)] disabled:opacity-50"
              >
                {generatingSlug ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                تولید Slug
              </button>
            )}
            {onGenerateDescription && (
              <button
                type="button"
                disabled={!canQuickFill || generatingDescription || quickFillLoading}
                onClick={onGenerateDescription}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-xs font-semibold hover:bg-[var(--color-border-muted)] disabled:opacity-50"
              >
                {generatingDescription ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                توضیحات AI
              </button>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Slug از عنوان فارسی ساخته می‌شود · توضیحات با OpenAI (تنظیمات)
          </p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="list-slug" className="block text-sm font-medium text-[var(--color-text)]">
            Slug *
          </label>
          <div className="flex items-center gap-2">
            {onGenerateSlug && !showQuickActions && (
              <button
                type="button"
                disabled={!values.title.trim() || generatingSlug}
                onClick={onGenerateSlug}
                className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline disabled:opacity-50"
              >
                {generatingSlug ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                تولید از عنوان
              </button>
            )}
            {onResetSlugAuto && (
              <button
                type="button"
                onClick={onResetSlugAuto}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--primary)]"
              >
                <RefreshCw className="w-3 h-3" />
                {slugAutoMode ? 'ویرایش دستی' : 'همگام با عنوان'}
              </button>
            )}
          </div>
        </div>
        <input
          id="list-slug"
          type="text"
          value={values.slug}
          onChange={(e) => onSlugChange(e.target.value)}
          required
          readOnly={slugAutoMode}
          dir="ltr"
          placeholder="best-films-after-watch"
          className={`${inputClass} ${
            values.slug.length === 0
              ? ''
              : slugValid && slugCheck?.status !== 'taken'
                ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                : slugCheck?.status === 'taken' || (values.slug.length > 0 && !slugValid)
                  ? 'border-red-400 ring-1 ring-red-400/20'
                  : ''
          } ${slugAutoMode ? 'bg-[var(--color-bg)] cursor-default' : ''}`}
        />
        {slugCheck?.status === 'checking' && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            در حال بررسی…
          </p>
        )}
        {slugCheck?.status === 'available' && (
          <p className="text-xs text-emerald-600 mt-1">slug در دسترس است</p>
        )}
        {slugCheck?.status === 'taken' && (
          <p className="text-xs text-red-600 mt-1">
            اشغال شده
            {slugCheck.existingTitle ? ` («${slugCheck.existingTitle}»)` : ''}
            {slugCheck.suggestion && onApplySlugSuggestion && (
              <button
                type="button"
                className="mr-2 text-[var(--primary)] underline"
                onClick={() => onApplySlugSuggestion(slugCheck.suggestion!)}
              >
                پیشنهاد: {slugCheck.suggestion}
              </button>
            )}
          </p>
        )}
        {slugCheck?.status === 'invalid' && (
          <p className="text-xs text-red-600 mt-1">فرمت slug نامعتبر — حروف کوچک، اعداد و خط تیره</p>
        )}
        {!slugCheck || slugCheck.status === 'idle' ? (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {slugAutoMode
              ? 'با تایپ عنوان، slug خودکار به‌روز می‌شود'
              : 'حروف کوچک انگلیسی، اعداد و خط تیره'}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="list-description" className="block text-sm font-medium text-[var(--color-text)]">
            توضیحات
          </label>
          {onGenerateDescription && !showQuickActions && (
            <button
              type="button"
              disabled={!canQuickFill || generatingDescription}
              onClick={onGenerateDescription}
              className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline disabled:opacity-50"
            >
              {generatingDescription ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              تولید با AI
            </button>
          )}
        </div>
        <textarea
          id="list-description"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className={inputClass}
          placeholder="توضیح کوتاه برای کارت لیست در اپ…"
        />
      </div>
    </div>
  );
}
