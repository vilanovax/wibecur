'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';
import { Button } from '@/components/ui/button';

interface DeleteListConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listTitle: string;
  onConfirm: () => void;
}

export default function DeleteListConfirmModal({
  isOpen,
  onClose,
  listId,
  listTitle,
  onConfirm,
}: DeleteListConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const res = await fetch(`/api/user/lists/${listId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حذف لیست');
      }

      setToastMessage('لیست با موفقیت حذف شد');
      setShowToast(true);

      if (onConfirm) {
        onConfirm();
      }

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف لیست');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="تأیید حذف لیست">
        <div className="p-6 space-y-6">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-8 text-destructive" />
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-foreground">
              آیا مطمئن هستید؟
            </h3>
            <p className="text-muted-foreground">
              لیست <span className="font-semibold">&quot;{listTitle}&quot;</span> به همراه تمام آیتم‌های آن حذف خواهد شد و این عمل قابل بازگشت نیست.
            </p>
          </div>

          {error && (
            <div className="rounded-surface border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button type="button" variant="destructive" size="lg" className="w-full" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال حذف...
                </>
              ) : (
                <>
                  <X />
                  بله، حذف کن
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={onClose} disabled={isDeleting}>
              انصراف
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

