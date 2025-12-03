'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';

interface ItemReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  onReportSuccess?: () => void;
}

const REPORT_REASONS = [
  {
    id: 'spelling_error',
    label: 'غلط املایی',
    icon: '✏️',
    description: 'متن آیتم شامل اشتباهات املایی است',
  },
  {
    id: 'incorrect_info',
    label: 'صحت اطلاعات',
    icon: '📋',
    description: 'اطلاعات ارائه شده درست نیست',
  },
  {
    id: 'offensive',
    label: 'توهین آمیز',
    icon: '🚫',
    description: 'محتوا توهین آمیز یا نامناسب است',
  },
  {
    id: 'other',
    label: 'سایر',
    icon: '💬',
    description: 'سایر دلایل (لطفاً توضیح دهید)',
  },
];

export default function ItemReportModal({
  isOpen,
  onClose,
  itemId,
  onReportSuccess,
}: ItemReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('لطفاً یک دلیل انتخاب کنید');
      return;
    }

    if (selectedReason === 'other' && !description.trim()) {
      setError('لطفاً توضیحات را وارد کنید');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/items/${itemId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: selectedReason,
          description: selectedReason === 'other' ? description.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت ریپورت');
      }

      // Reset form
      setSelectedReason(null);
      setDescription('');
      setError(null);

      // Show success toast
      setToastMessage('گزارش شما با موفقیت ثبت شد. از همکاری شما متشکریم!');
      setShowToast(true);

      // Call success callback
      if (onReportSuccess) {
        onReportSuccess();
      }

      // Close modal after a short delay to show toast
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Error reporting item:', err);
      setError(err.message || 'خطا در ثبت ریپورت');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason(null);
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">گزارش آیتم</h2>
              <p className="text-sm text-gray-500">لطفاً دلیل گزارش را انتخاب کنید</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Report Reasons */}
        <div className="space-y-3 mb-6">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.id}
              onClick={() => setSelectedReason(reason.id)}
              disabled={isSubmitting}
              className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
                selectedReason === reason.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{reason.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{reason.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{reason.description}</div>
                </div>
                {selectedReason === reason.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Description for 'other' reason */}
        {selectedReason === 'other' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              توضیحات *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="لطفاً دلیل گزارش را توضیح دهید..."
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50"
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedReason || (selectedReason === 'other' && !description.trim())}
          className="w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>در حال ثبت...</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              <span>ثبت گزارش</span>
            </>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </BottomSheet>
  );
}

