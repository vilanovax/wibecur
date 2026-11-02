'use client';

import type { CategoryLayoutType } from '@/types/category-page';
import {
  CATEGORY_LAYOUT_OPTIONS,
  COVER_DISPLAY_MODE_OPTIONS,
  type CoverDisplayMode,
} from '@/lib/admin/category-form-constants';
import { getDisplayImageUrl } from '@/lib/display-image';
import CategoryHeroImageField from '@/components/admin/categories/CategoryHeroImageField';
import Image from 'next/image';
import { Check } from 'lucide-react';

export type CategoryAppearanceValues = {
  accentColor: string;
  layoutType: CategoryLayoutType | '';
  heroImage: string;
  coverDisplayMode: CoverDisplayMode;
};

interface CategoryPageAppearanceFieldsProps {
  values: CategoryAppearanceValues;
  onChange: (patch: Partial<CategoryAppearanceValues>) => void;
  primaryColor?: string;
  /** اگر پیش‌نمایش sticky کنار فرم است، پیش‌نمایش هیرو داخل فرم را کم کن */
  compactPreview?: boolean;
}

const inputClass =
  'w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-(--primary)';

export default function CategoryPageAppearanceFields({
  values,
  onChange,
  primaryColor = '#6366F1',
  compactPreview = false,
}: CategoryPageAppearanceFieldsProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-(--color-text)">
          نمایش عنوان روی کاور لیست
        </legend>
        <p className="wibe-caption text-wibe-secondary">
          اگر عنوان داخل فایل کاور طراحی شده، «پوستر طراحی‌شده» را انتخاب کن تا متن و سایهٔ UI دوبل
          نشود.
        </p>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="حالت نمایش کاور">
          {COVER_DISPLAY_MODE_OPTIONS.map((opt) => {
            const selected = values.coverDisplayMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ coverDisplayMode: opt.value })}
                className={`relative rounded-xl border p-3 text-start transition-colors ${
                  selected
                    ? 'border-(--primary) bg-(--primary)/5 ring-1 ring-(--primary)/40'
                    : 'border-(--color-border) hover:bg-(--color-bg)'
                }`}
              >
                {selected ? (
                  <span className="absolute inset-e-2 top-2 flex size-5 items-center justify-center rounded-full bg-(--primary) text-white">
                    <Check className="size-3" strokeWidth={2.5} aria-hidden />
                  </span>
                ) : null}
                <p className="text-sm font-semibold text-(--color-text) pe-6">{opt.label}</p>
                <p className="mt-1 wibe-caption leading-relaxed text-wibe-secondary">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="accentColor" className="mb-1 block text-sm font-medium text-(--color-text)">
            رنگ تاکید
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="accentColor"
              value={values.accentColor || primaryColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-lg border border-(--color-border)"
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
          <p className="mt-1 wibe-caption text-wibe-secondary">
            اگر خالی باشد از رنگ اصلی دسته استفاده می‌شود.
          </p>
        </div>

        <div>
          <label htmlFor="layoutType" className="mb-1 block text-sm font-medium text-(--color-text)">
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
      </div>

      <CategoryHeroImageField
        value={values.heroImage}
        onChange={(heroImage) => onChange({ heroImage })}
      />

      {!compactPreview && (values.heroImage || values.layoutType) ? (
        <div className="overflow-hidden rounded-xl border border-(--color-border)">
          <p className="bg-(--color-bg) px-3 py-2 wibe-caption font-medium text-wibe-secondary">
            پیش‌نمایش صفحه دسته
          </p>
          <div className="relative aspect-16/9 max-h-44 overflow-hidden bg-neutral-950">
            {values.heroImage ? (
              <>
                <Image
                  src={getDisplayImageUrl(values.heroImage)}
                  alt=""
                  fill
                  className="scale-110 object-cover opacity-55 blur-2xl"
                  unoptimized
                />
                <Image
                  src={getDisplayImageUrl(values.heroImage)}
                  alt=""
                  fill
                  className="object-contain object-center"
                  unoptimized
                />
              </>
            ) : null}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-3 text-start">
              <p className="text-sm font-semibold text-white drop-shadow">نمونه صفحه دسته</p>
              {values.layoutType ? (
                <span className="text-xs text-white/90">
                  {CATEGORY_LAYOUT_OPTIONS.find((o) => o.value === values.layoutType)?.label}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
