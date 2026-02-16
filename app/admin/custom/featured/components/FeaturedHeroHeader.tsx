'use client';

import { RefreshCw } from 'lucide-react';

type Props = {
  hasActiveSlot: boolean;
  onRefresh: () => void;
  refreshing: boolean;
};

export default function FeaturedHeroHeader({ hasActiveSlot, onRefresh, refreshing }: Props) {
  return (
    <header
      className="rounded-3xl p-8 shadow-lg border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/40 dark:to-gray-900 transition-shadow"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            مدیریت لیست منتخب صفحه اصلی
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            کنترل برنامه‌ریزی نمایش Hero در اپ موبایل
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              hasActiveSlot
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${hasActiveSlot ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {hasActiveSlot ? 'Active' : 'No active slot'}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
        </div>
      </div>
    </header>
  );
}
