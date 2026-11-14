'use client';

import { useState } from 'react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-types';

const REASON_OPTIONS = [
  { value: 'Spam', label: 'اسپم' },
  { value: 'Duplicate', label: 'تکراری' },
  { value: 'Policy Violation', label: 'نقض قوانین' },
  { value: 'Other', label: 'سایر' },
];

interface MoveToTrashModalProps {
  row: ListIntelligenceRow | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string, reason?: string) => Promise<void>;
}

export default function MoveToTrashModal({
  row,
  open,
  onClose,
  onConfirm,
}: MoveToTrashModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open || !row) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(row.id, reason || undefined);
      setReason('');
      onClose();
    } catch (e) {
      // caller may show error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-to-trash-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-(--color-surface) border border-(--color-border-muted) shadow-xl p-6"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="move-to-trash-title" className="text-lg font-semibold text-(--color-text) mb-4">
          انتقال به زباله‌دان
        </h2>
        <p className="text-sm text-wibe-secondary mb-2">
          این لیست <strong className="text-(--color-text)">{row.saveCount.toLocaleString('fa-IR')}</strong> ذخیره دارد.
        </p>
        <p className="text-sm text-wibe-secondary mb-2">
          رتبه فعلی: <strong className="text-(--color-text)">#{row.rank}</strong>
        </p>
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          این کار حذف دائمی نیست. لیست در «زباله‌دان» دیده می‌شود و صفحهٔ ویرایشش دیگر باز نمی‌شود
          تا بازگردانی کنید. حذف دائمی فقط از داخل زباله‌دان ممکن است.
          {!row.isActive ? (
            <>
              {' '}
              الان این لیست پیش‌نویس/غیرفعال است — فقط «غیرفعال» بودنش یعنی در زباله‌دان نیست؛ با تأیید
              اینجا واقعاً به زباله‌دان می‌رود.
            </>
          ) : null}
        </p>
        <label className="block text-sm font-medium text-(--color-text) mb-2">
          دلیل (اختیاری)
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) mb-6"
        >
          <option value="">—</option>
          {REASON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-(--color-bg) text-(--color-text) hover:bg-(--color-border)"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? 'در حال انتقال…' : 'انتقال به زباله‌دان'}
          </button>
        </div>
      </div>
    </div>
  );
}
