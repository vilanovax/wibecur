'use client';

import Image from 'next/image';
import type { CategoryFormStep } from '@/components/admin/categories/CategoryFormStepper';
import type { CategoryLayoutType } from '@/types/category-page';
import {
  CATEGORY_LAYOUT_OPTIONS,
  COVER_DISPLAY_MODE_OPTIONS,
  type CoverDisplayMode,
} from '@/lib/admin/category-form-constants';
import { getDisplayImageUrl } from '@/lib/display-image';

export type CategoryFormPreviewData = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  accentColor: string;
  description: string;
  heroImage: string;
  layoutType: CategoryLayoutType | '';
  coverDisplayMode?: CoverDisplayMode;
  order: number;
  isActive: boolean;
  trendingWeight: number;
};

interface CategoryFormStickyPreviewProps {
  step: CategoryFormStep;
  values: CategoryFormPreviewData;
  /** صفحه ویرایش vs ویزارد ساخت */
  mode?: 'edit' | 'wizard';
}

export default function CategoryFormStickyPreview({
  step,
  values,
  mode = 'wizard',
}: CategoryFormStickyPreviewProps) {
  const accent = values.accentColor || values.color || '#6366F1';
  const layoutLabel = values.layoutType
    ? CATEGORY_LAYOUT_OPTIONS.find((o) => o.value === values.layoutType)?.label
    : null;
  const coverMode = values.coverDisplayMode ?? 'ui';
  const coverModeLabel =
    COVER_DISPLAY_MODE_OPTIONS.find((o) => o.value === coverMode)?.label ?? 'عنوان روی کاور';
  const heroSrc = values.heroImage
    ? getDisplayImageUrl(values.heroImage)
    : values.slug
      ? getDisplayImageUrl(null, values.slug)
      : '';
  const showCoverScrim = coverMode === 'ui';
  const showCoverTitle = coverMode === 'ui';
  const showTitleBelow = coverMode === 'photo';

  const subtitle =
    mode === 'edit'
      ? 'کارت دسته · کاور لیست · وضعیت'
      : step === 1
        ? 'کارت دسته + کاور'
        : step === 2
          ? 'کارت + صفحه دسته'
          : 'خلاصه قبل از انتشار';

  return (
    <div
      className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm"
      dir="rtl"
    >
      <div className="border-b border-(--color-border) bg-(--color-bg) px-4 py-3">
        <p className="text-sm font-semibold text-(--color-text)">پیش‌نمایش زنده</p>
        <p className="mt-0.5 wibe-caption text-wibe-secondary">{subtitle}</p>
      </div>

      <div className="space-y-4 p-4">
        <div
          className="flex items-center gap-3 rounded-xl border border-(--color-border) p-4"
          style={{ backgroundColor: `${accent}12` }}
        >
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: `${accent}28`, color: accent }}
          >
            {values.icon || '📁'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-(--color-text)">
              {values.name || 'نام دسته'}
            </p>
            <p className="truncate font-mono text-xs text-wibe-secondary" dir="ltr">
              /{values.slug || 'slug'}
            </p>
            {values.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-wibe-secondary">{values.description}</p>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-(--color-border)">
          <div className="flex items-center justify-between gap-2 bg-(--color-bg) px-3 py-1.5">
            <p className="wibe-caption font-medium text-wibe-secondary">کارت کاور لیست در اپ</p>
            <span className="rounded-full bg-(--color-surface) px-2 py-0.5 wibe-caption text-wibe-secondary">
              {coverModeLabel}
            </span>
          </div>
          <div className="relative aspect-16/10 min-h-24 bg-neutral-950">
            {heroSrc ? (
              <Image src={heroSrc} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${accent}66 0%, #1f2937 100%)`,
                }}
              />
            )}
            {showCoverScrim ? (
              <div
                className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent"
                aria-hidden
              />
            ) : null}
            {showCoverTitle ? (
              <div className="absolute inset-x-0 bottom-0 p-3 text-start">
                <p className="line-clamp-2 text-xs font-semibold text-white drop-shadow">
                  {values.name || 'عنوان لیست نمونه'}
                </p>
              </div>
            ) : null}
          </div>
          {showTitleBelow ? (
            <div className="border-t border-(--color-border) px-3 py-2 text-start">
              <p className="line-clamp-2 text-xs font-semibold text-(--color-text)">
                {values.name || 'عنوان لیست نمونه'}
              </p>
            </div>
          ) : null}
          {coverMode === 'baked' ? (
            <p className="border-t border-(--color-border) bg-(--color-bg) px-3 py-2 wibe-caption text-wibe-secondary">
              بدون متن و سایهٔ UI — عنوان داخل فایل کاور فرض می‌شود.
            </p>
          ) : null}
        </div>

        {(values.heroImage || values.layoutType || mode === 'edit') && (
          <div className="overflow-hidden rounded-xl border border-(--color-border)">
            <p className="bg-(--color-bg) px-3 py-1.5 wibe-caption font-medium text-wibe-secondary">
              صفحه دسته
              {layoutLabel ? ` · ${layoutLabel}` : ''}
            </p>
            <div
              className="relative flex h-24 items-end p-3"
              style={
                heroSrc
                  ? undefined
                  : { background: `linear-gradient(135deg, ${accent}55 0%, #1f2937 100%)` }
              }
            >
              {heroSrc ? (
                <Image src={heroSrc} alt="" fill className="object-cover" unoptimized />
              ) : null}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent" />
              <div className="relative z-10 text-xs font-semibold text-white drop-shadow">
                {values.name || 'نام دسته'}
              </div>
            </div>
          </div>
        )}

        {(mode === 'edit' || step >= 3) && (
          <ul className="space-y-1.5 text-xs text-wibe-secondary">
            <li>
              <span className="text-(--color-text)">وضعیت: </span>
              {values.isActive ? (
                <span className="font-medium text-emerald-600">فعال</span>
              ) : (
                <span className="font-medium text-amber-600">غیرفعال (پیش‌نویس)</span>
              )}
            </li>
            <li>
              <span className="text-(--color-text)">ترتیب: </span>
              {values.order.toLocaleString('fa-IR')}
            </li>
            {values.trendingWeight !== 1 && (
              <li>
                <span className="text-(--color-text)">وزن: </span>
                {values.trendingWeight.toLocaleString('fa-IR')}×
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
