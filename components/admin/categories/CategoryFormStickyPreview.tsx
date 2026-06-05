'use client';

import Image from 'next/image';
import type { CategoryFormStep } from '@/components/admin/categories/CategoryFormStepper';
import type { CategoryLayoutType } from '@/types/category-page';
import { CATEGORY_LAYOUT_OPTIONS } from '@/lib/admin/category-form-constants';
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
  order: number;
  isActive: boolean;
  trendingWeight: number;
};

interface CategoryFormStickyPreviewProps {
  step: CategoryFormStep;
  values: CategoryFormPreviewData;
}

export default function CategoryFormStickyPreview({
  step,
  values,
}: CategoryFormStickyPreviewProps) {
  const accent = values.accentColor || values.color || '#6366F1';
  const layoutLabel = values.layoutType
    ? CATEGORY_LAYOUT_OPTIONS.find((o) => o.value === values.layoutType)?.label
    : null;
  const heroSrc = values.heroImage
    ? getDisplayImageUrl(values.heroImage)
    : values.slug
      ? getDisplayImageUrl(null, values.slug)
      : '';

  return (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden"
      dir="rtl"
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <p className="text-sm font-semibold text-[var(--color-text)]">پیش‌نمایش</p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
          {step === 1 && 'کارت دسته در اپ'}
          {step === 2 && 'کارت + صفحه دسته'}
          {step === 3 && 'خلاصه قبل از انتشار'}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* کارت دسته */}
        <div
          className="rounded-xl border border-[var(--color-border)] p-4 flex items-center gap-3"
          style={{ backgroundColor: `${accent}12` }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${accent}28`, color: accent }}
          >
            {values.icon || '📁'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)] truncate">
              {values.name || 'نام دسته'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-mono truncate" dir="ltr">
              /{values.slug || 'slug'}
            </p>
            {values.description && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                {values.description}
              </p>
            )}
          </div>
        </div>

        {/* هیرو — مرحله ۲ و ۳ */}
        {(step >= 2 || values.heroImage || values.layoutType) && (
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <p className="text-[10px] font-medium text-[var(--color-text-muted)] px-3 py-1.5 bg-[var(--color-bg)]">
              صفحه دسته
              {layoutLabel ? ` · ${layoutLabel}` : ''}
            </p>
            <div
              className="relative h-24 flex items-end p-3"
              style={
                heroSrc
                  ? undefined
                  : { background: `linear-gradient(135deg, ${accent}55 0%, #1f2937 100%)` }
              }
            >
              {heroSrc && (
                <Image src={heroSrc} alt="" fill className="object-cover" unoptimized />
              )}
              <div className="relative z-10 text-white text-xs font-semibold drop-shadow">
                {values.name || 'نام دسته'}
              </div>
            </div>
          </div>
        )}

        {/* خلاصه انتشار — مرحله ۳ */}
        {step >= 3 && (
          <ul className="text-xs space-y-1.5 text-[var(--color-text-muted)]">
            <li>
              <span className="text-[var(--color-text)]">وضعیت: </span>
              {values.isActive ? (
                <span className="text-emerald-600 font-medium">فعال</span>
              ) : (
                <span className="text-amber-600 font-medium">غیرفعال (پیش‌نویس)</span>
              )}
            </li>
            <li>
              <span className="text-[var(--color-text)]">ترتیب: </span>
              {values.order.toLocaleString('fa-IR')}
            </li>
            {values.trendingWeight !== 1 && (
              <li>
                <span className="text-[var(--color-text)]">وزن: </span>
                {values.trendingWeight.toLocaleString('fa-IR')}×
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
