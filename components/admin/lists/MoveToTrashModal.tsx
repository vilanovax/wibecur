'use client';

import { useState } from 'react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-intelligence';

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
        className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-muted)] shadow-xl p-6"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="move-to-trash-title" className="text-lg font-semibold text-[var(--color-text)] mb-4">
          انتقال به زباله‌دان
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">
          این لیست <strong className="text-[var(--color-text)]">{row.saveCount.toLocaleString('fa-IR')}</strong> ذخیره دارد.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          رتبه فعلی: <strong className="text-[var(--color-text)]">#{row.rank}</strong>
        </p>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
          دلیل (اختیاری)
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] mb-6"
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
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
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
