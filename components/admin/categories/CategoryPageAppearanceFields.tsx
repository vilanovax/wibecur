'use client';

import type { CategoryLayoutType } from '@/types/category-page';
import { CATEGORY_LAYOUT_OPTIONS } from '@/lib/admin/category-form-constants';
import { getDisplayImageUrl } from '@/lib/display-image';
import Image from 'next/image';

export type CategoryAppearanceValues = {
  accentColor: string;
  layoutType: CategoryLayoutType | '';
  heroImage: string;
};

interface CategoryPageAppearanceFieldsProps {
  values: CategoryAppearanceValues;
  onChange: (patch: Partial<CategoryAppearanceValues>) => void;
  primaryColor?: string;
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent';

export default function CategoryPageAppearanceFields({
  values,
  onChange,
  primaryColor = '#6366F1',
}: CategoryPageAppearanceFieldsProps) {
  const accent = values.accentColor || primaryColor;

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <label htmlFor="accentColor" className="block text-sm font-medium text-[var(--color-text)] mb-1">
          رنگ تاکید (Accent)
        </label>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            id="accentColor"
            value={values.accentColor || primaryColor}
            onChange={(e) => onChange({ accentColor: e.target.value })}
            className="h-10 w-14 rounded-lg cursor-pointer border border-[var(--color-border)]"
          />
          <input
            type="text"
            value={values.accentColor}
            onChange={(e) => onChange({ accentColor: e.target.value })}
            dir="ltr"
            className={`flex-1 ${inputClass}`}
            placeholder={primaryColor}
          />
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          در صفحه دسته در اپ استفاده می‌شود؛ اگر خالی باشد از رنگ اصلی دسته استفاده می‌شود.
        </p>
      </div>

      <div>
        <label htmlFor="layoutType" className="block text-sm font-medium text-[var(--color-text)] mb-1">
          چیدمان صفحه دسته
        </label>
        <select
          id="layoutType"
          value={values.layoutType}
          onChange={(e) =>
            onChange({ layoutType: (e.target.value || '') as CategoryLayoutType | '' })
          }
          className={inputClass}
        >
          <option value="">پیش‌فرض (بر اساس slug)</option>
          {CATEGORY_LAYOUT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} — {opt.description}
            </option>
          ))}
        </select>
      </div>

      {!values.heroImage && (
        <p className="text-xs text-[var(--color-text-muted)] rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2.5">
          تصویر کاور را در مرحله «هویت» آپلود کنید. اگر خالی باشد از بنر پیش‌فرض دسته استفاده می‌شود.
        </p>
      )}

      {(values.heroImage || values.layoutType) && (
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
          <p className="text-xs font-medium text-[var(--color-text-muted)] px-3 py-2 bg-[var(--color-bg)]">
            پیش‌نمایش صفحه دسته
          </p>
          <div
            className="relative aspect-[16/9] max-h-40 flex items-end p-3"
            style={{
              background: values.heroImage
                ? undefined
                : `linear-gradient(135deg, ${accent}50 0%, #1f2937 100%)`,
            }}
          >
            {values.heroImage && (
              <Image
                src={getDisplayImageUrl(values.heroImage)}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            )}
            <div className="relative z-10 text-white text-sm font-semibold drop-shadow">
              نمونه صفحه دسته
              {values.layoutType && (
                <span className="block text-xs font-normal opacity-90">
                  {CATEGORY_LAYOUT_OPTIONS.find((o) => o.value === values.layoutType)?.label}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
