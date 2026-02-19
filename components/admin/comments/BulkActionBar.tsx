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
      className="sticky top-0 z-10 bg-indigo-50 border-b border-indigo-200 rounded-2xl shadow-sm border border-indigo-100 p-3 mb-4 flex flex-wrap items-center justify-between gap-3"
      style={{ direction: 'rtl' }}
    >
      <span className="text-sm font-medium text-indigo-900">
        {selectedCount.toLocaleString('fa-IR')} مورد انتخاب شد
      </span>
      <div className="flex gap-2">
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
          پاک کردن انتخاب
        </button>
      </div>
    </div>
  );
}
