'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

interface CommentFormProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  onSubmit: () => void;
}

export default function CommentForm({
  isOpen,
  onClose,
  itemId,
  onSubmit,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('لطفاً متن کامنت را وارد کنید');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/items/${itemId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'خطا در ثبت کامنت');
      }

      setContent('');
      onClose();
      onSubmit(); // Refresh comments
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت کامنت');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ثبت کامنت">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              نظر شما
            </label>
            <textarea
              id="comment"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError('');
              }}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="نظر خود را بنویسید..."
              disabled={isLoading}
              maxLength={undefined} // Will be validated server-side based on settings
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                کامنت‌های نامناسب به صورت خودکار فیلتر می‌شوند
              </p>
              <p className="text-xs text-gray-400">
                {content.length} کاراکتر
              </p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={isLoading}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading || !content.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ارسال
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </BottomSheet>
  );
}

