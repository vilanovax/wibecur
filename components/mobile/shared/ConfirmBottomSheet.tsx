'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

interface ConfirmBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

export default function ConfirmBottomSheet({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  variant = 'default',
  isLoading = false,
}: ConfirmBottomSheetProps) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.99]'
      : 'bg-primary text-white active:scale-[0.99]';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxHeight="auto"
      zIndex={70}
      escapeToClose={!isLoading}
      closeOnBackdrop={!isLoading}
    >
      <div className="px-2.5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
        <div className="mb-4 flex justify-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              variant === 'danger' ? 'bg-red-50' : 'bg-primary/10'
            }`}
          >
            <AlertTriangle
              className={`h-7 w-7 ${variant === 'danger' ? 'text-red-600' : 'text-primary'}`}
              strokeWidth={1.75}
            />
          </div>
        </div>

        <p className="mb-5 text-center wibe-small leading-relaxed text-wibe-secondary">{message}</p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl wibe-small font-semibold transition-transform disabled:opacity-50 ${confirmClass}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                لطفاً صبر کن…
              </>
            ) : (
              confirmLabel
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 w-full rounded-xl border border-wibe bg-white wibe-small font-semibold text-foreground transition-colors hover:bg-wibe-surface active:scale-[0.99] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
