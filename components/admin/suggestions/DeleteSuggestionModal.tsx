'use client';

import { useState } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';

interface DeleteSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestionId: string;
  suggestionTitle: string;
  type: 'list' | 'item';
  onSuccess: () => void;
}

export default function DeleteSuggestionModal({
  isOpen,
  onClose,
  suggestionId,
  suggestionTitle,
  type,
  onSuccess,
}: DeleteSuggestionModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (message.trim()) {
        params.set('message', message.trim());
      }

      const res = await fetch(`/api/admin/suggestions/${type}s/${suggestionId}?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در حذف پیشنهاد');
      }

      onSuccess();
      onClose();
      setMessage('');
    } catch (error: any) {
      setError(error.message || 'خطا در حذف پیشنهاد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">حذف پیشنهاد</h2>
              <p className="text-sm text-gray-500 mt-1">{suggestionTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              آیا از حذف این پیشنهاد اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              پیام به کاربر (اختیاری)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
              placeholder="پیام اختیاری برای اطلاع کاربر از دلیل حذف..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال حذف...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  حذف
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

