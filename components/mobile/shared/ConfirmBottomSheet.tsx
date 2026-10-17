'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Button } from '@/components/ui/button';

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

        <p className="mb-5 text-center text-sm leading-relaxed text-muted-foreground">{message}</p>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={variant === 'danger' ? 'destructive' : 'brand'}
            size="lg"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                لطفاً صبر کن…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onClose}
            disabled={isLoading}
            className="w-full"
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
