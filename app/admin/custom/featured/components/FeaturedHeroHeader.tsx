'use client';

import { RefreshCw, Plus } from 'lucide-react';

type Props = {
  upcomingCount: number;
  onRefresh: () => void;
  refreshing: boolean;
  onAddSlot?: () => void;
};

export default function FeaturedHeroHeader({
  upcomingCount,
  onRefresh,
  refreshing,
  onAddSlot,
}: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3" dir="rtl">
      <div className="min-w-0">
        <h1 className="text-xl font-bold leading-snug text-(--color-text)">
          منتخب هوم
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-wibe-secondary">
          بنر اول اپ را برای این هفته و هفته‌های بعد بچینید.
          {upcomingCount > 0
            ? ` ${upcomingCount.toLocaleString('fa-IR')} اسلات در صف است.`
            : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onAddSlot && (
          <button
            type="button"
            onClick={onAddSlot}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={2} />
            اسلات جدید
          </button>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-(--color-border) hover:bg-(--color-bg) disabled:opacity-50"
          aria-label="بروزرسانی"
        >
          <RefreshCw
            className={`size-4 ${refreshing ? 'animate-spin' : ''}`}
            strokeWidth={1.5}
          />
        </button>
      </div>
    </header>
  );
}
