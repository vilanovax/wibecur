'use client';

import { XCircle } from 'lucide-react';

interface RejectCommentDialogProps {
  isOpen: boolean;
  preview?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loadingLabel?: string;
}

export default function RejectCommentDialog({
  isOpen,
  preview,
  isLoading = false,
  onCancel,
  onConfirm,
  title = 'رد کامنت',
  message = 'این کامنت از نمایش عمومی حذف می‌شود. ادامه می‌دهید؟',
  confirmLabel = 'رد کردن',
  loadingLabel = 'در حال رد…',
}: RejectCommentDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60">
      <div
        className="bg-[var(--color-surface)] rounded-2xl shadow-xl max-w-md w-full p-5 border border-[var(--color-border)]"
        role="dialog"
        aria-labelledby="reject-comment-title"
        dir="rtl"
      >
        <div className="flex items-center gap-2 text-rose-600 mb-2">
          <XCircle className="w-5 h-5" />
          <h3 id="reject-comment-title" className="font-semibold text-[var(--color-text)]">
            {title}
          </h3>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">{message}</p>
        {preview && (
          <p className="text-sm text-[var(--color-text)] bg-[var(--color-bg)] rounded-xl p-3 border border-[var(--color-border)] line-clamp-3 mb-4">
            {preview}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)] disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
