'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';

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
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-gray-900">
              آیا مطمئن هستید؟
            </h3>
            <p className="text-gray-600">
              لیست <span className="font-semibold">"{listTitle}"</span> به همراه تمام آیتم‌های آن حذف خواهد شد و این عمل قابل بازگشت نیست.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  در حال حذف...
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  بله، حذف کن
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              انصراف
            </button>
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

