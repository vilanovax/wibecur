'use client';

import { AlertTriangle, Loader2, Upload } from 'lucide-react';

interface BulkImportConfirmDialogProps {
  isOpen: boolean;
  isLoading?: boolean;
  categoryName: string;
  categoryIcon?: string | null;
  listTitle: string;
  currentItemCount: number;
  importCount: number;
  overwriteExistingData?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function BulkImportConfirmDialog({
  isOpen,
  isLoading = false,
  categoryName,
  categoryIcon,
  listTitle,
  currentItemCount,
  importCount,
  overwriteExistingData = false,
  onCancel,
  onConfirm,
}: BulkImportConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl"
        role="dialog"
        aria-labelledby="bulk-import-confirm-title"
        dir="rtl"
      >
        <div className="mb-3 flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <h3 id="bulk-import-confirm-title" className="font-semibold text-[var(--color-text)]">
            تأیید مقصد import
          </h3>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {importCount.toLocaleString('fa-IR')} آیتم به لیست زیر اضافه می‌شود. قبل از شروع، مقصد
          را بررسی کنید:
        </p>

        <div className="mb-4 space-y-2 rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[var(--color-text-muted)]">دسته</span>
            <span className="font-semibold text-[var(--color-text)]">
              {categoryIcon ? `${categoryIcon} ` : ''}
              {categoryName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[var(--color-text-muted)]">لیست</span>
            <span className="font-bold text-violet-800">{listTitle}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[var(--color-text-muted)]">آیتم‌های فعلی</span>
            <span className="font-medium text-[var(--color-text)]">
              {currentItemCount.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-violet-100 pt-2">
            <span className="text-[var(--color-text-muted)]">افزودن</span>
            <span className="font-bold text-violet-700">
              +{importCount.toLocaleString('fa-IR')} آیتم
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-violet-100 pt-2">
            <span className="text-[var(--color-text-muted)]">دادهٔ موجود</span>
            <span className="font-medium text-[var(--color-text)]">
              {overwriteExistingData ? 'به‌روزرسانی با JSON' : 'حفظ دادهٔ DB'}
            </span>
          </div>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-amber-800">
          اگر لیست اشتباه است، «انصراف» بزنید و از بخش «مقصد import» لیست درست را انتخاب کنید.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium hover:bg-[var(--color-bg)] disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال import…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                بله، import کن
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
