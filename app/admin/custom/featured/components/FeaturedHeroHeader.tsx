'use client';

import { RefreshCw, Plus } from 'lucide-react';

type Props = {
  hasActiveSlot: boolean;
  upcomingCount: number;
  onRefresh: () => void;
  refreshing: boolean;
  onAddSlot?: () => void;
};

export default function FeaturedHeroHeader({
  hasActiveSlot,
  upcomingCount,
  onRefresh,
  refreshing,
  onAddSlot,
}: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          منتخب هوم
        </h1>
        <p className="mt-1 text-sm leading-normal text-[var(--color-text-muted)]">
          بنر اول اپ را برای این هفته و هفته‌های بعد بچینید.
          {upcomingCount > 0
            ? ` ${upcomingCount.toLocaleString('fa-IR')} اسلات در صف است.`
            : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium ${
            hasActiveSlot
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${hasActiveSlot ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}
          />
          {hasActiveSlot ? 'اسلات فعال' : 'بدون اسلات فعال'}
        </span>
        {onAddSlot && (
          <button
            type="button"
            onClick={onAddSlot}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            اسلات جدید
          </button>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 text-sm hover:bg-[var(--color-bg)] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          بروزرسانی
        </button>
      </div>
    </header>
  );
}
