'use client';

import { CheckCircle, XCircle } from 'lucide-react';

interface BulkConfirmDialogProps {
  isOpen: boolean;
  action: 'approve' | 'reject';
  count: number;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function BulkConfirmDialog({
  isOpen,
  action,
  count,
  isLoading = false,
  onCancel,
  onConfirm,
}: BulkConfirmDialogProps) {
  if (!isOpen) return null;

  const isApprove = action === 'approve';
  const Icon = isApprove ? CheckCircle : XCircle;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60">
      <div
        className="bg-[var(--color-surface)] rounded-2xl shadow-xl max-w-sm w-full p-5 border border-[var(--color-border)]"
        role="dialog"
        dir="rtl"
      >
        <div
          className={`flex items-center gap-2 mb-2 ${
            isApprove ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          <Icon className="w-5 h-5" />
          <h3 className="font-semibold text-[var(--color-text)]">
            {isApprove ? 'تایید گروهی' : 'رد گروهی'}
          </h3>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {isApprove
            ? `${count.toLocaleString('fa-IR')} کامنت تایید شود؟`
            : `${count.toLocaleString('fa-IR')} کامنت رد شود؟`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-bg)] disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 ${
              isApprove
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isLoading ? 'در حال انجام…' : 'تایید عملیات'}
          </button>
        </div>
      </div>
    </div>
  );
}
