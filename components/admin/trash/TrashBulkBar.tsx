'use client';

import { ArchiveRestore, X } from 'lucide-react';

type Props = {
  selectedCount: number;
  onRestore: () => void;
  onClear: () => void;
  loading?: boolean;
};

export default function TrashBulkBar({ selectedCount, onRestore, onClear, loading }: Props) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pt-2 pointer-events-none lg:pr-[280px]"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xl px-4 py-3">
        <span className="text-sm font-medium text-[var(--color-text)] dark:text-white tabular-nums">
          {selectedCount.toLocaleString('fa-IR')} مورد انتخاب شده
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <ArchiveRestore className="h-4 w-4" />
            بازگردانی انتخاب‌شده‌ها
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm font-medium text-[var(--color-text)] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            لغو انتخاب
          </button>
        </div>
      </div>
    </div>
  );
}
