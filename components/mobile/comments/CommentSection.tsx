'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ChevronDown, Send } from 'lucide-react';
import CommentItem from './CommentItem';
import Toast from '@/components/shared/Toast';
import CommentReportModal from './CommentReportModal';
import {
  COMMENTS_INITIAL_VISIBLE,
  COMMENTS_LOAD_MORE_STEP,
  DEFAULT_LIST_COMMENT_MAX_LENGTH,
  MIN_COMMENT_LENGTH,
} from '@/lib/comment-limits';

interface Comment {
  id: string;
  content: string;
  isFiltered: boolean;
  helpfulUp: number;
  helpfulDown: number;
  userVote: number | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    image: string | null;
    curatorLevel?: string | null;
    avatarType?: string | null;
    avatarId?: string | null;
    avatarStatus?: string | null;
  };
  canDelete: boolean;
}

interface CommentsResponse {
  comments: Comment[];
  commentsEnabled: boolean;
  maxCommentLength: number;
}

interface CommentSectionProps {
  itemId: string;
  onCommentAdded?: () => void;
  refreshTrigger?: number;
  /** داخل کارت پایین صفحه (دسکتاپ) — بدون border بالای تکراری */
  embeddedInPanel?: boolean;
  /** وقتی false است تا ورود به viewport درخواست نمی‌زند */
  fetchEnabled?: boolean;
}

async function fetchItemComments(itemId: string, sortBy: string): Promise<CommentsResponse> {
  const res = await fetch(`/api/items/${itemId}/comments?sort=${sortBy}`);
  const data = await res.json();
  if (!data.success) {
    return { comments: [], commentsEnabled: true, maxCommentLength: DEFAULT_LIST_COMMENT_MAX_LENGTH };
  }
  return {
    comments: data.data.comments ?? [],
    commentsEnabled: data.data.commentsEnabled ?? true,
    maxCommentLength: data.data.maxCommentLength ?? DEFAULT_LIST_COMMENT_MAX_LENGTH,
  };
}

function ItemCommentInput({
  isExpanded,
  onExpand,
  onSubmit,
  isLoading,
  maxCommentLength,
}: {
  isExpanded: boolean;
  onExpand: () => void;
  onSubmit: (content: string) => Promise<boolean>;
  isLoading: boolean;
  maxCommentLength: number;
}) {
  const [content, setContent] = useState('');
  const trimmedLength = content.trim().length;
  const warnThreshold = Math.floor(maxCommentLength * 0.8);
  const isNearLimit = content.length >= warnThreshold;
  const isOverLimit = content.length > maxCommentLength;
  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_COMMENT_LENGTH;
  const canSubmit = trimmedLength >= MIN_COMMENT_LENGTH && !isOverLimit && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await onSubmit(content.trim());
    if (ok) setContent('');
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="w-full h-[52px] flex items-center px-4 rounded-2xl border border-gray-200 bg-white shadow-sm text-gray-500 text-sm text-right hover:border-primary/40 hover:bg-gray-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        نظرت درباره این آیتم چیه؟
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-end gap-2 p-3 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxCommentLength))}
          placeholder="نظرت درباره این آیتم چیه؟"
          className="flex-1 min-h-[44px] py-2.5 px-0 border-0 bg-transparent text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-1"
          rows={2}
          maxLength={maxCommentLength}
          aria-describedby="item-comment-char-count"
          autoFocus
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="ارسال نظر"
          className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" aria-hidden />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setContent('')}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
          >
            انصراف
          </button>
          {isTooShort && (
            <span className="text-xs text-amber-600">حداقل {MIN_COMMENT_LENGTH.toLocaleString('fa-IR')} کاراکتر</span>
          )}
        </div>
        <span
          id="item-comment-char-count"
          className={`text-xs tabular-nums ${
            isOverLimit ? 'text-red-500 font-medium' : isNearLimit ? 'text-amber-600' : 'text-gray-400'
          }`}
        >
          {content.length.toLocaleString('fa-IR')}/{maxCommentLength.toLocaleString('fa-IR')}
        </span>
      </div>
    </form>
  );
}

export default function CommentSection({
  itemId,
  onCommentAdded,
  refreshTrigger,
  embeddedInPanel = false,
  fetchEnabled = true,
}: CommentSectionProps) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('popular');
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(COMMENTS_INITIAL_VISIBLE);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['items', itemId, 'comments', sortBy, refreshTrigger ?? 0],
    queryFn: () => fetchItemComments(itemId, sortBy),
    enabled: fetchEnabled && !!itemId,
  });
  const comments = data?.comments ?? [];
  const commentsEnabled = data?.commentsEnabled ?? true;
  const maxCommentLength = data?.maxCommentLength ?? DEFAULT_LIST_COMMENT_MAX_LENGTH;

  useEffect(() => {
    setVisibleCount(COMMENTS_INITIAL_VISIBLE);
  }, [itemId, sortBy]);

  const handleSubmit = async (content: string): Promise<boolean> => {
    if (status !== 'authenticated') return false;
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/items/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const resData = await res.json();
      if (resData.success) {
        refetch();
        onCommentAdded?.();
        setIsFormExpanded(false);
        setToast({ message: resData.message || 'نظرت ثبت شد ✨', type: 'success' });
        return true;
      }
      setToast({
        message: resData.error || (res.status === 429 ? 'کمی صبر کن و دوباره امتحان کن 🙂' : 'ارسال نشد'),
        type: 'error',
      });
      return false;
    } catch {
      setToast({ message: 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
      return false;
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVote = async (commentId: string, value: 1 | -1) => {
    if (status !== 'authenticated') {
      setToast({ message: 'برای رای دادن وارد شو', type: 'error' });
      return;
    }
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const resData = await response.json();

      if (resData.success) {
        queryClient.setQueryData<CommentsResponse>(
          ['items', itemId, 'comments', sortBy, refreshTrigger ?? 0],
          (prev) =>
            prev
              ? {
                  ...prev,
                  comments: prev.comments.map((c) =>
                    c.id === commentId
                      ? {
                          ...c,
                          helpfulUp: resData.data.helpfulUp,
                          helpfulDown: resData.data.helpfulDown,
                          userVote: resData.data.userVote,
                        }
                      : c
                  ),
                }
              : prev
        );
      } else {
        refetch();
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
      refetch();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenReport = (commentId: string) => {
    if (status !== 'authenticated') {
      setToast({ message: 'برای گزارش نظر وارد شو', type: 'error' });
      return;
    }
    setReportCommentId(commentId);
  };

  const handleReportSuccess = () => {
    setToast({ message: 'ممنون که اطلاع دادی 🙏 بررسیش می‌کنیم', type: 'success' });
  };

  const handleDelete = async (commentId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      const resData = await response.json();

      if (resData.success) {
        queryClient.setQueryData<CommentsResponse>(
          ['items', itemId, 'comments', sortBy, refreshTrigger ?? 0],
          (prev) =>
            prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) } : prev
        );
        onCommentAdded?.();
      } else {
        setToast({ message: resData.error || 'خطا در حذف نظر', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setToast({ message: 'خطا در حذف نظر', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const displayedComments = comments.slice(0, visibleCount);
  const hasMore = visibleCount < comments.length;
  const remainingCount = comments.length - visibleCount;
  const loadMoreStep = Math.min(COMMENTS_LOAD_MORE_STEP, remainingCount);
  const hasComments = comments.length > 0;

  return (
    <section
      id="comments"
      className={`scroll-mt-28 ${
        embeddedInPanel ? 'mt-0 border-t-0 pt-0' : 'mt-2 border-t border-wibe pt-5'
      }`}
    >
      {!commentsEnabled && (
        <p className="wibe-caption text-wibe-secondary mb-3">نظرها غیرفعال است</p>
      )}

      <div className="space-y-3">
        {commentsEnabled && status === 'authenticated' && (
          <ItemCommentInput
            isExpanded={isFormExpanded}
            onExpand={() => setIsFormExpanded(true)}
            onSubmit={handleSubmit}
            isLoading={submitLoading}
            maxCommentLength={maxCommentLength}
          />
        )}

        {!isLoading && comments.length > 0 && (
          <div className="flex gap-2 pb-1">
            <span className="text-xs text-gray-500 py-1.5">مرتب‌سازی:</span>
              <button
                type="button"
                onClick={() => setSortBy('popular')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === 'popular' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                مفیدترین
              </button>
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === 'newest' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                جدیدترین
              </button>
            </div>
        )}

        <div className={hasComments ? 'mt-2' : 'mt-1'}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-2 text-center wibe-caption text-wibe-secondary">
              هنوز گفتگویی نیست —{' '}
              {status === 'authenticated' && commentsEnabled ? (
                <button
                  type="button"
                  onClick={() => setIsFormExpanded(true)}
                  className="font-medium text-primary hover:underline"
                >
                  اولین نظر رو بذار
                </button>
              ) : (
                'اولین نظر رو بذار'
              )}
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {displayedComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onVote={handleVote}
                    onReport={handleOpenReport}
                    onDelete={handleDelete}
                    isLoading={isActionLoading}
                  />
                ))}
              </div>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((v) => v + COMMENTS_LOAD_MORE_STEP)}
                  className="w-full py-3 mt-4 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronDown className="w-4 h-4" />
                  {loadMoreStep.toLocaleString('fa-IR')} نظر دیگر ({remainingCount.toLocaleString('fa-IR')} باقی‌مانده)
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      <CommentReportModal
        isOpen={!!reportCommentId}
        onClose={() => setReportCommentId(null)}
        reportEndpoint={reportCommentId ? `/api/comments/${reportCommentId}/report` : ''}
        onReportSuccess={handleReportSuccess}
      />
    </section>
  );
}
