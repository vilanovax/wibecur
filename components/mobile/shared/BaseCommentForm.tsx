'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { track, type AnalyticsData } from '@/lib/analytics';
import { fa } from '@/lib/utils';
import { signOutIfStaleSession } from '@/lib/session-client';

interface BaseCommentFormProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
  onSubmit: () => void;
  title?: string;
  analytics?: AnalyticsData;
}

export default function BaseCommentForm({
  isOpen,
  onClose,
  apiUrl,
  onSubmit,
  title = 'ثبت نظر',
  analytics,
}: BaseCommentFormProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('لطفاً متن نظر را وارد کنید');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (await signOutIfStaleSession(response, data)) {
        return;
      }

      if (!response.ok) {
        const message = data?.error || (response.status === 429 ? 'لطفاً چند دقیقه صبر کنید و دوباره امتحان کنید.' : 'خطا در ثبت نظر');
        throw new Error(message);
      }
      if (!data.success) {
        throw new Error(data.error || 'خطا در ثبت نظر');
      }

      setContent('');
      track('comment_submit', analytics);
      onClose();
      onSubmit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت نظر');
    } finally {
      setIsLoading(false);
    }
  };

  // شیت حداکثر تا ۱۰۰px بالای پایین صفحه — تا دکمه ارسال و ناو همیشه دیده شوند
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} maxHeight="calc(100vh - 100px)">
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
          {error && (
            <div className="mb-4 rounded-surface border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-foreground mb-2"
            >
              نظر شما
            </label>
            <Textarea
              id="comment"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError('');
              }}
              rows={6}
              placeholder="نظر خود را بنویسید..."
              disabled={isLoading}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                نظرهای نامناسب به‌صورت خودکار فیلتر می‌شوند
              </p>
              <p className="text-xs text-muted-foreground">
                {fa(content.length)} کاراکتر
              </p>
            </div>
          </div>
        </div>

        {/* نوار دکمه‌ها — شیت با maxHeight calc(100vh - 100px) تمام می‌شود پس دکمه‌ها بالای ناو می‌مانند */}
        <div className="flex-shrink-0 border-t border-border bg-popover p-4">
          <div className="flex gap-3">
            <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onClose} disabled={isLoading}>
              انصراف
            </Button>
            <Button type="submit" variant="brand" size="lg" className="flex-1" disabled={isLoading || !content.trim()}>
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
            </Button>
          </div>
        </div>
      </form>
    </BottomSheet>
  );
}
