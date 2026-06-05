'use client';

import { Loader2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  listTitle: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteSlotDialog({
  isOpen,
  listTitle,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl max-w-sm w-full p-5 border border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-text)] mb-2">حذف اسلات؟</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          اسلات «<strong className="text-[var(--color-text)]">{listTitle}</strong>» از برنامه حذف
          می‌شود. این عمل قابل بازگشت نیست.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-xl border border-[var(--color-border)] text-sm font-medium"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}
