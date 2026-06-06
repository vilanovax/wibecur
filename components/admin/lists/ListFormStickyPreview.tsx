'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ListEditFormStep } from '@/components/admin/lists/ListEditFormStepper';

export type ListFormPreviewData = {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  horizontalImage: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  badge: string;
  itemCount?: number;
};

interface ListFormStickyPreviewProps {
  values: ListFormPreviewData;
  step?: ListEditFormStep;
}

function ImageArea({
  src,
  fallback,
  className,
}: {
  src: string;
  fallback: React.ReactNode;
  className: string;
}) {
  const [broken, setBroken] = useState(false);

  if (src && !broken) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          unoptimized
          sizes="280px"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  return <div className={`relative ${className}`}>{fallback}</div>;
}

export default function ListFormStickyPreview({ values, step = 1 }: ListFormStickyPreviewProps) {
  const accent = values.categoryColor || '#6366F1';

  const stepHint =
    step === 1 ? 'اطلاعات پایه' : step === 2 ? 'نمایش و ظاهر' : 'آیتم‌ها و خلاصه';

  const cardFallback = (
    <div
      className="absolute inset-0 flex items-center justify-center text-4xl"
      style={{ background: `linear-gradient(135deg, ${accent}33, var(--color-bg))` }}
    >
      {values.categoryIcon || '📋'}
    </div>
  );

  const bannerFallback = (
    <div
      className="absolute inset-0 flex items-center justify-center text-2xl opacity-60"
      style={{ background: `linear-gradient(135deg, ${accent}22, var(--color-bg))` }}
    >
      🎬
    </div>
  );

  return (
    <div
      className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] shadow-sm overflow-hidden"
      dir="rtl"
    >
      <div className="px-3 py-2 border-b border-[var(--color-border-muted)] bg-[var(--color-bg)]/60">
        <p className="text-xs font-semibold text-[var(--color-text)]">پیش‌نمایش</p>
        <p className="text-[10px] text-[var(--color-text-muted)]">کارت + بنر · {stepHint}</p>
      </div>
      <div className="p-3 space-y-3">
        {step >= 2 && (
          <div className="rounded-lg border border-[var(--color-border-muted)] overflow-hidden">
            <p className="text-[9px] px-2 py-1 bg-[var(--color-bg)] text-[var(--color-text-muted)]">
              بنر افقی
            </p>
            <ImageArea
              src={values.horizontalImage}
              fallback={bannerFallback}
              className="h-16 bg-[var(--color-bg)]"
            />
          </div>
        )}

        <div
          className={`rounded-xl border overflow-hidden ${
            values.isFeatured ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-[var(--color-border-muted)]'
          }`}
        >
          <p className="text-[9px] px-2 py-1 bg-[var(--color-bg)] text-[var(--color-text-muted)] border-b border-[var(--color-border-muted)]">
            کارت کاور
          </p>
          <ImageArea src={values.coverImage} fallback={cardFallback} className="h-24 bg-[var(--color-bg)]" />
          <div className="p-2.5">
            <div className="flex flex-wrap gap-1 mb-1">
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                {values.categoryIcon} {values.categoryName || 'دسته'}
              </span>
              {values.isFeatured && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium">
                  Featured
                </span>
              )}
              {!values.isActive && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-100 text-red-800">غیرفعال</span>
              )}
              {!values.isPublic && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800">خصوصی</span>
              )}
              {values.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--color-bg)]">{values.badge}</span>
              )}
            </div>
            <p className="font-semibold text-sm text-[var(--color-text)] truncate">
              {values.title || 'عنوان لیست'}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] font-mono truncate mt-0.5" dir="ltr">
              /lists/{values.slug || 'slug'}
            </p>
            {values.description && (
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1 line-clamp-2">{values.description}</p>
            )}
            {step >= 3 && values.itemCount != null && (
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 pt-1.5 border-t border-[var(--color-border-muted)]">
                {values.itemCount.toLocaleString('fa-IR')} آیتم در لیست
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
