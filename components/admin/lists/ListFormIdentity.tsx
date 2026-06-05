'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { isValidListSlug } from '@/lib/admin/list-slug';
import type { SlugCheckState } from '@/hooks/useListSlugCheck';

export type ListIdentityValues = {
  title: string;
  slug: string;
  description: string;
  categoryId: string;
};

type CategoryOption = { id: string; name: string; icon: string };

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
}: ListFormIdentityProps) {
  const slugValid = values.slug.length > 0 && isValidListSlug(values.slug);

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
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="list-slug" className="block text-sm font-medium text-[var(--color-text)]">
            Slug *
          </label>
          {onResetSlugAuto && (
            <button
              type="button"
              onClick={onResetSlugAuto}
              className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              {slugAutoMode ? 'ویرایش دستی' : 'تولید خودکار از عنوان'}
            </button>
          )}
        </div>
        <input
          id="list-slug"
          type="text"
          value={values.slug}
          onChange={(e) => onSlugChange(e.target.value)}
          required
          readOnly={slugAutoMode}
          dir="ltr"
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
          <p className="text-xs text-[var(--color-text-muted)] mt-1">حروف کوچک انگلیسی، اعداد و خط تیره</p>
        ) : null}
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
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="list-description" className="block text-sm font-medium text-[var(--color-text)] mb-1">
          توضیحات
        </label>
        <textarea
          id="list-description"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className={inputClass}
          placeholder="توضیحات لیست..."
        />
      </div>
    </div>
  );
}
