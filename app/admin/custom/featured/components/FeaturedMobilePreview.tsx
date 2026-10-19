'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Smartphone } from 'lucide-react';

export type PreviewList = {
  title: string;
  description?: string | null;
  coverImage?: string | null;
  saveCount: number;
  itemCount?: number;
  badge?: string | null;
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
        ? 'Fallback (لیست ویژه)'
        : mode === 'preview'
          ? 'پیش‌نمایش انتخاب'
          : 'پیش‌نمایش');

  return (
    <div className="sticky top-4" dir="rtl">
      <div className="flex items-center gap-2 mb-3 text-xs font-medium text-[var(--color-text-muted)]">
        <Smartphone className="w-4 h-4" />
        {modeLabel}
      </div>
      <div className="mx-auto max-w-[280px] rounded-[2rem] border-[6px] border-gray-800 bg-gray-900 p-2 shadow-xl">
        <div className="rounded-[1.4rem] overflow-hidden bg-white dark:bg-gray-800">
          {!list ? (
            <div className="h-52 flex items-center justify-center bg-[var(--color-bg)] text-sm text-[var(--color-text-muted)] p-4 text-center">
              لیستی برای پیش‌نمایش انتخاب نشده
            </div>
          ) : (
            <>
              <div className="relative h-44">
                <ImageWithFallback
                  src={list.coverImage ?? ''}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  fallbackIcon="🎬"
                  fallbackClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute top-2 right-2">
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {badgeLabels[list.badge ?? 'featured'] ?? '⭐ ویژه'}
                  </span>
                </div>
                <div className="absolute bottom-2 right-3 left-3">
                  <h3 className="text-white text-sm font-bold line-clamp-2">{list.title}</h3>
                  {list.description && (
                    <p className="text-white/85 text-[10px] mt-0.5 line-clamp-1">
                      {list.description}
                    </p>
                  )}
                  <p className="text-white/80 text-[10px] mt-1">
                    ⭐ {list.saveCount.toLocaleString('fa-IR')} ·{' '}
                    {(list.itemCount ?? 0).toLocaleString('fa-IR')} آیتم
                  </p>
                </div>
              </div>
              <div className="p-2 flex gap-1.5 bg-white dark:bg-gray-800">
                <div className="flex-1 py-2 rounded-lg bg-[var(--primary)] text-white text-[10px] font-medium text-center">
                  ذخیره کن ⭐
                </div>
                <div className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] text-[10px] font-medium text-center">
                  مشاهده لیست
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
