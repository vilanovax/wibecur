'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Smartphone } from 'lucide-react';
import {
  COVER_DISPLAY_MODE_OPTIONS,
  normalizeCoverDisplayMode,
  type CoverDisplayMode,
} from '@/lib/admin/category-form-constants';

export type PreviewList = {
  title: string;
  description?: string | null;
  coverImage?: string | null;
  saveCount: number;
  itemCount?: number;
  badge?: string | null;
  coverDisplayMode?: string | null;
  categorySlug?: string | null;
};

type Props = {
  list: PreviewList | null;
  mode: 'live' | 'fallback' | 'preview' | 'empty';
  label?: string;
};

const badgeLabels: Record<string, string> = {
  trending: '🔥 ترند هفته',
  new: '✨ جدید',
  featured: '⭐ ویژه',
  TRENDING: '🔥 ترند هفته',
  NEW: '✨ جدید',
  FEATURED: '⭐ ویژه',
};

export default function FeaturedMobilePreview({ list, mode, label }: Props) {
  const modeLabel =
    label ??
    (mode === 'live'
      ? 'نمایش فعلی در اپ'
      : mode === 'fallback'
        ? 'لیست جایگزین'
        : mode === 'preview'
          ? 'پیش‌نمایش انتخاب'
          : 'پیش‌نمایش');

  const coverMode: CoverDisplayMode = normalizeCoverDisplayMode(list?.coverDisplayMode);
  const coverModeLabel =
    COVER_DISPLAY_MODE_OPTIONS.find((o) => o.value === coverMode)?.label ?? 'عنوان روی کاور';
  const showCoverScrim = coverMode === 'ui';
  const showCoverTitle = coverMode !== 'baked';
  const showTitleBelow = coverMode === 'baked' || coverMode === 'photo';

  return (
    <div className="sticky top-4" dir="rtl">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-wibe-secondary">
        <Smartphone className="size-4" aria-hidden />
        {modeLabel}
      </div>
      <div className="mx-auto max-w-70 rounded-[2rem] border-[6px] border-gray-800 bg-gray-900 p-2 shadow-xl">
        <div className="overflow-hidden rounded-[1.4rem] bg-white dark:bg-gray-800">
          {!list ? (
            <div className="flex h-52 items-center justify-center bg-(--color-bg) p-4 text-center text-sm text-wibe-secondary">
              لیستی برای پیش‌نمایش انتخاب نشده
            </div>
          ) : (
            <>
              <div className="relative h-44">
                <ImageWithFallback
                  src={list.coverImage ?? ''}
                  alt={list.title}
                  className="h-full w-full object-cover"
                  fallbackIcon="🎬"
                  fallbackClassName="h-full w-full"
                />
                {showCoverScrim ? (
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/10" />
                )}
                <div className="absolute inset-e-2 top-2">
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {badgeLabels[list.badge ?? 'featured'] ?? '⭐ ویژه'}
                  </span>
                </div>
                {showCoverTitle && coverMode === 'ui' ? (
                  <div className="absolute inset-x-3 bottom-2 text-start">
                    <h3 className="line-clamp-2 text-sm font-bold text-white">{list.title}</h3>
                    {list.description ? (
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-white/85">
                        {list.description}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-white/80">
                      ⭐ {list.saveCount.toLocaleString('fa-IR')} ·{' '}
                      {(list.itemCount ?? 0).toLocaleString('fa-IR')} آیتم
                    </p>
                  </div>
                ) : null}
              </div>
              {showTitleBelow ? (
                <div className="border-t border-gray-100 px-3 py-2 text-start dark:border-gray-700">
                  <h3 className="line-clamp-2 text-xs font-bold text-(--color-text)">
                    {list.title}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-wibe-secondary">
                    حالت کاور دسته: {coverModeLabel}
                  </p>
                </div>
              ) : (
                <p className="border-t border-gray-100 px-3 py-1.5 text-[10px] text-wibe-secondary dark:border-gray-700">
                  حالت کاور دسته: {coverModeLabel}
                  {list.categorySlug ? ` · /${list.categorySlug}` : ''}
                </p>
              )}
              <div className="flex gap-1.5 bg-white p-2 dark:bg-gray-800">
                <div className="flex-1 rounded-lg bg-primary py-2 text-center text-[10px] font-medium text-white">
                  ذخیره کن ⭐
                </div>
                <div className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-[10px] font-medium text-wibe-secondary dark:border-gray-700 dark:text-(--color-text-subtle)">
                  مشاهده لیست
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="mt-2 text-center wibe-caption text-wibe-secondary">
        تنظیم حالت متن/تصویر از{' '}
        <a href="/admin/categories" className="text-primary hover:underline">
          دسته‌بندی‌ها
        </a>
      </p>
    </div>
  );
}
