'use client';

import { useMemo } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { isValidCategorySlug } from '@/lib/admin/category-intelligence';
import type { SlugCheckState } from '@/hooks/useCategorySlugCheck';
import CategoryHeroImageField from '@/components/admin/categories/CategoryHeroImageField';

export type CategoryIdentityValues = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  accentColor: string;
  description: string;
  heroImage?: string;
};

interface CategoryFormIdentityProps {
  values: CategoryIdentityValues;
  onChange: (patch: Partial<CategoryIdentityValues>) => void;
  onNameChange?: (name: string) => void;
  onSlugChange?: (slug: string) => void;
  slugEditable?: boolean;
  /** پیش‌نمایش کنار فرم — در صفحه new با sticky preview خاموش می‌شود */
  showInlinePreview?: boolean;
  slugAutoMode?: boolean;
  onResetSlugAuto?: () => void;
  slugCheck?: SlugCheckState;
  onApplySlugSuggestion?: (slug: string) => void;
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent';

export default function CategoryFormIdentity({
  values,
  onChange,
  onNameChange,
  onSlugChange,
  slugEditable = true,
  showInlinePreview = true,
  slugAutoMode = false,
  onResetSlugAuto,
  slugCheck,
  onApplySlugSuggestion,
}: CategoryFormIdentityProps) {
  const slugValid = useMemo(() => isValidCategorySlug(values.slug), [values.slug]);

  const handleName = (name: string) => {
    if (onNameChange) {
      onNameChange(name);
    } else {
      onChange({ name });
    }
  };

  return (
    <div className={`grid grid-cols-1 ${showInlinePreview ? 'lg:grid-cols-2' : ''} gap-6`} dir="rtl">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            نام دسته‌بندی *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={values.name}
            onChange={(e) => handleName(e.target.value)}
            required
            className={inputClass}
            placeholder="مثال: فیلم و سریال"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label htmlFor="slug" className="block text-sm font-medium text-[var(--color-text)]">
              Slug (نامک) *
            </label>
            {slugEditable && onResetSlugAuto && (
              <button
                type="button"
                onClick={onResetSlugAuto}
                className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                {slugAutoMode ? 'ویرایش دستی' : 'تولید خودکار از نام'}
              </button>
            )}
          </div>
          <input
            type="text"
            id="slug"
            name="slug"
            value={values.slug}
            onChange={(e) => {
              const slug = e.target.value.toLowerCase().trim();
              if (onSlugChange) onSlugChange(slug);
              else onChange({ slug });
            }}
            required
            disabled={!slugEditable || (slugAutoMode && !onSlugChange)}
            readOnly={slugAutoMode && !!onSlugChange}
            dir="ltr"
            className={`${inputClass} ${
              values.slug.length === 0
                ? ''
                : slugValid && slugCheck?.status !== 'taken'
                  ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                  : slugCheck?.status === 'taken' || (values.slug.length > 0 && !slugValid)
                    ? 'border-red-400 ring-1 ring-red-400/20'
                    : ''
            } ${slugAutoMode && onSlugChange ? 'bg-[var(--color-bg)] cursor-default' : ''}`}
            placeholder="movies"
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {slugAutoMode
              ? 'از نام دسته ساخته می‌شود — برای slug سفارشی «ویرایش دستی» را بزنید'
              : 'حروف انگلیسی کوچک، اعداد و خط تیره'}
          </p>
          {values.slug.length > 0 && slugCheck?.status === 'checking' && (
            <p className="text-xs mt-1 text-[var(--color-text-muted)] inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              در حال بررسی…
            </p>
          )}
          {values.slug.length > 0 && slugValid && slugCheck?.status === 'available' && (
            <p className="text-xs mt-1 text-emerald-600">✓ slug آزاد است</p>
          )}
          {slugCheck?.status === 'taken' && (
            <div className="mt-1 text-xs text-red-600 space-y-1">
              <p>
                این slug قبلاً استفاده شده
                {slugCheck.existingName ? ` («${slugCheck.existingName}»)` : ''}
              </p>
              {slugCheck.suggestion && onApplySlugSuggestion && (
                <button
                  type="button"
                  onClick={() => onApplySlugSuggestion(slugCheck.suggestion!)}
                  className="text-[var(--primary)] hover:underline font-mono"
                  dir="ltr"
                >
                  پیشنهاد: {slugCheck.suggestion}
                </button>
              )}
            </div>
          )}
          {values.slug.length > 0 && !slugValid && slugCheck?.status !== 'taken' && (
            <p className="text-xs mt-1 text-red-600">نامک معتبر نیست</p>
          )}
        </div>

        <div>
          <label htmlFor="icon" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            آیکون (Emoji) *
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              id="icon"
              name="icon"
              value={values.icon}
              onChange={(e) => onChange({ icon: e.target.value })}
              required
              className={`flex-1 ${inputClass}`}
              placeholder="🎬"
            />
            {values.icon && (
              <span className="text-3xl" role="img" aria-label="preview">
                {values.icon}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['🎬', '☕', '📚', '🎧', '✈️', '🚗', '🍽️', '🎮'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange({ icon: emoji })}
                className="w-9 h-9 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="color" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            رنگ
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              id="color"
              name="color"
              value={values.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="h-10 w-14 rounded-lg cursor-pointer border border-[var(--color-border)]"
            />
            <input
              type="text"
              name="color"
              value={values.color}
              onChange={(e) => onChange({ color: e.target.value })}
              dir="ltr"
              className={`flex-1 ${inputClass}`}
              placeholder="#6366F1"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            توضیحات
          </label>
          <textarea
            id="description"
            name="description"
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={3}
            className={inputClass}
            placeholder="توضیحات دسته‌بندی..."
          />
        </div>

        <CategoryHeroImageField
          value={values.heroImage ?? ''}
          onChange={(heroImage) => onChange({ heroImage })}
        />
      </div>

      {showInlinePreview && (
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-2">پیش‌نمایش در اپ</p>
          <div
            className="rounded-2xl border border-[var(--color-border)] p-5 flex items-center gap-4"
            style={{
              backgroundColor: (values.accentColor || values.color)
                ? `${values.accentColor || values.color}12`
                : 'var(--color-bg)',
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{
                backgroundColor: (values.accentColor || values.color)
                  ? `${values.accentColor || values.color}25`
                  : 'var(--color-bg)',
                color: values.accentColor || values.color || 'var(--color-text)',
              }}
            >
              {values.icon || '📁'}
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text)]">{values.name || 'نام دسته'}</p>
              <p className="text-xs text-[var(--color-text-muted)] font-mono" dir="ltr">
                /{values.slug || 'slug'}
              </p>
              {values.description && (
                <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                  {values.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
