'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (score: number) => Promise<void>;
  commentContent?: string;
  action: 'delete' | 'edit' | 'report';
  isLoading?: boolean;
}

export default function PenaltyModal({
  isOpen,
  onClose,
  onSubmit,
  commentContent,
  action,
  isLoading = false,
}: PenaltyModalProps) {
  const [selectedScore, setSelectedScore] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(selectedScore);
  };

  const actionLabels = {
    delete: 'حذف',
    edit: 'ویرایش',
    report: 'ریپورت',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                امتیاز منفی برای کاربر
              </h2>
              <p className="text-sm text-gray-500">
                کامنت {actionLabels[action]} شد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {commentContent && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">متن کامنت:</p>
              <p className="text-sm text-gray-900 line-clamp-3">
                {commentContent}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              امتیاز منفی (۰ تا ۵):
            </label>
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setSelectedScore(score)}
                  className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${
                    selectedScore === score
                      ? 'bg-red-600 text-white scale-110 shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isLoading}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {selectedScore === 0 && 'بدون امتیاز منفی'}
                {selectedScore === 1 && 'امتیاز منفی خفیف'}
                {selectedScore === 2 && 'امتیاز منفی متوسط'}
                {selectedScore === 3 && 'امتیاز منفی قابل توجه'}
                {selectedScore === 4 && 'امتیاز منفی زیاد'}
                {selectedScore === 5 && 'امتیاز منفی شدید'}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 این امتیاز برای تعیین پنالتی کاربر استفاده می‌شود. امتیازهای
              منفی کاربران در بخش &quot;کاربران خاطی&quot; قابل مشاهده است.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'در حال ثبت...' : 'ثبت امتیاز'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

