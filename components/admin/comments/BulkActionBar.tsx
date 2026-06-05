'use client';

import { CheckCircle, XCircle, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onBulkApprove,
  onBulkReject,
  onClearSelection,
  isLoading = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 pointer-events-none"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto pointer-events-auto bg-[var(--color-surface)] border border-[var(--primary)]/40 shadow-lg rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
        <span className="text-sm font-medium text-[var(--color-text)]">
          {selectedCount.toLocaleString('fa-IR')} مورد انتخاب شد
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBulkApprove}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            تایید گروهی
          </button>
          <button
            type="button"
            onClick={onBulkReject}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            رد گروهی
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
          >
            <X className="w-4 h-4" />
            پاک کردن
          </button>
        </div>
      </div>
    </div>
  );
}
