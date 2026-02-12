'use client';

import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  loading?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
}

export default function BulkActionBar({
  selectedCount,
  loading = false,
  onApprove,
  onReject,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 p-4 bg-white border-t border-gray-200 shadow-lg rounded-t-2xl">
      <p className="text-sm font-medium text-gray-700">
        <span className="text-primary font-semibold">{selectedCount}</span> مورد انتخاب شده
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          لغو
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          رد همه
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          تأیید همه
        </button>
      </div>
    </div>
  );
}
