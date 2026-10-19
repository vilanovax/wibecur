'use client';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'default';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const confirmVariant = {
  danger: 'destructive',
  primary: 'brand',
  default: 'default',
} as const;

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) onCancel();
      }}
      role="alertdialog"
      dismissible={!loading}
      title={title}
      description={message}
      className="max-w-sm"
      footer={
        <>
          <Button
            variant={confirmVariant[variant]}
            disabled={loading}
            onClick={() => onConfirm()}
          >
            {loading ? 'لطفاً صبر کنید…' : confirmLabel}
          </Button>
          <Button variant="outline" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
        </>
      }
    />
  );
}
