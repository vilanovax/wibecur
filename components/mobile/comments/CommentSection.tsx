'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Card } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Spinner } from '@/components/ui/spinner';
import CommentItem from './CommentItem';
import Toast from '@/components/shared/Toast';
import CommentReportModal from './CommentReportModal';
import { usePreferDesktopAutofocus } from '@/lib/hooks/usePreferDesktopAutofocus';
import {
  COMMENTS_INITIAL_VISIBLE,
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
  const preferDesktopAutofocus = usePreferDesktopAutofocus();
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
      <Button
        type="button"
        onClick={onExpand}
        variant="outline"
        size="lg"
        className="w-full justify-start px-4 font-normal text-muted-foreground"
      >
        نظرت درباره این آیتم چیه؟
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Card className="flex items-end gap-2 bg-popover p-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxCommentLength))}
          placeholder="نظرت درباره این آیتم چیه؟"
          className="min-h-11 flex-1 resize-none border-0 bg-transparent px-0 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          rows={2}
          maxLength={maxCommentLength}
          aria-describedby="item-comment-char-count"
          autoFocus={preferDesktopAutofocus}
        />
        <Button
          type="submit"
          disabled={!canSubmit}
          aria-label="ارسال نظر"
          variant="brand"
          size="icon"
          className="size-11 shrink-0 rounded-full"
        >
          <Send aria-hidden />
        </Button>
      </Card>
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-11" onClick={() => setContent('')}>
            انصراف
          </Button>
          {isTooShort && (
            <span className="text-xs text-warning">حداقل {MIN_COMMENT_LENGTH.toLocaleString('fa-IR')} کاراکتر</span>
          )}
        </div>
        <span
          id="item-comment-char-count"
          className={`text-xs tabular-nums ${
            isOverLimit ? 'font-medium text-destructive' : isNearLimit ? 'text-warning' : 'text-muted-foreground'
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
  const [page, setPage] = useState(1);
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
    setPage(1);
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

  const pageSize = COMMENTS_INITIAL_VISIBLE;
  const totalPages = Math.max(1, Math.ceil(comments.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const displayedComments = comments.slice((safePage - 1) * pageSize, safePage * pageSize);
  const showSort = !isLoading && comments.length > 1;

  return (
    <section
      id="comments"
      className={`scroll-mt-28 ${
        embeddedInPanel ? 'mt-0 border-t-0 pt-0' : 'mt-2 border-t border-border pt-5'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="wibe-h3 text-foreground">نظرات</h2>
        {showSort ? (
          <SegmentedControl
            aria-label="مرتب‌سازی نظرات"
            size="sm"
            value={sortBy}
            onChange={(value) => setSortBy(value as 'popular' | 'newest')}
            options={[
              { value: 'popular', label: 'مفیدترین' },
              { value: 'newest', label: 'جدیدترین' },
            ]}
          />
        ) : null}
      </div>

      {!commentsEnabled && (
        <p className="mb-3 wibe-caption text-muted-foreground">نظرها غیرفعال است</p>
      )}

      <div className="space-y-4">
        {/* Thread اول — social proof قبل از کامپوزر */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-2 text-center wibe-caption text-muted-foreground">
              هنوز گفتگویی نیست
              {status === 'authenticated' && commentsEnabled
                ? ' — اولین نظر را پایین بنویس'
                : null}
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
              {totalPages > 1 ? (
                <Pagination
                  className="mt-4 justify-center"
                  page={safePage}
                  total={totalPages}
                  onChange={setPage}
                />
              ) : null}
            </>
          )}
        </div>

        {commentsEnabled && status === 'authenticated' ? (
          <div className="space-y-2 border-t border-border pt-3">
            <ItemCommentInput
              isExpanded={isFormExpanded}
              onExpand={() => setIsFormExpanded(true)}
              onSubmit={handleSubmit}
              isLoading={submitLoading}
              maxCommentLength={maxCommentLength}
            />
          </div>
        ) : null}
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
