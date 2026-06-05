'use client';

interface UserToggleActiveDialogProps {
  isOpen: boolean;
  userName: string;
  isActive: boolean;
  confirmText: string;
  isSubmitting: boolean;
  onConfirmTextChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function UserToggleActiveDialog({
  isOpen,
  userName,
  isActive,
  confirmText,
  isSubmitting,
  onConfirmTextChange,
  onCancel,
  onConfirm,
}: UserToggleActiveDialogProps) {
  if (!isOpen) return null;

  const needsTypedConfirm = isActive;
  const canSubmit = !needsTypedConfirm || confirmText === 'غیرفعال';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60">
      <div
        className="bg-[var(--color-surface)] rounded-2xl shadow-xl max-w-sm w-full p-5 border border-[var(--color-border)]"
        role="dialog"
        aria-labelledby="user-toggle-title"
      >
        <h3 id="user-toggle-title" className="font-semibold text-[var(--color-text)] mb-2">
          {isActive ? 'غیرفعال کردن کاربر' : 'فعال کردن کاربر'}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {isActive ? (
            <>
              <span className="font-medium text-[var(--color-text)]">{userName}</span> پس از
              غیرفعال‌سازی نمی‌تواند وارد شود. برای تأیید عبارت «غیرفعال» را وارد کنید.
            </>
          ) : (
            <>
              با فعال‌سازی،{' '}
              <span className="font-medium text-[var(--color-text)]">{userName}</span> دوباره به
              حساب خود دسترسی خواهد داشت.
            </>
          )}
        </p>
        {needsTypedConfirm && (
          <input
            type="text"
            value={confirmText}
            onChange={(e) => onConfirmTextChange(e.target.value)}
            placeholder="غیرفعال"
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] mb-4 text-sm"
            dir="rtl"
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2 rounded-xl border border-[var(--color-border)] font-medium text-sm disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 py-2 rounded-xl bg-red-600 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'در حال انجام…' : isActive ? 'غیرفعال کن' : 'فعال کن'}
          </button>
        </div>
      </div>
    </div>
  );
}
