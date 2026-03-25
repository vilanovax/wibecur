'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Loader2, TrendingUp, Clock } from 'lucide-react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import Toast from '@/components/shared/Toast';

interface Comment {
  id: string;
  content: string;
  isFiltered: boolean;
  likeCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    image: string | null;
  };
  isLiked: boolean;
  canDelete: boolean;
}

interface CommentsResponse {
  comments: Comment[];
  commentsEnabled: boolean;
  initialDisplayCount?: number;
  loadMoreCount?: number;
}

interface CommentSectionProps {
  itemId: string;
  onCommentAdded?: () => void;
  /** اگر ست شود، دکمه‌های «نوشتن نظر» این را صدا می‌زنند و فرم در والد رندر می‌شود (تا نوار دکمه‌ها مخفی شود). */
  onOpenCommentForm?: () => void;
  /** وقتی والد فرم کامنت را submit می‌کند، این عدد را عوض کن تا کامنت‌ها refetch شوند */
  refreshTrigger?: number;
}

async function fetchItemComments(itemId: string, sortBy: string): Promise<CommentsResponse> {
  const res = await fetch(`/api/items/${itemId}/comments?sort=${sortBy}`);
  const data = await res.json();
  if (!data.success) return { comments: [], commentsEnabled: true };
  return {
    comments: data.data.comments ?? [],
    commentsEnabled: data.data.commentsEnabled ?? true,
  };
}

export default function CommentSection({ itemId, onCommentAdded, onOpenCommentForm, refreshTrigger }: CommentSectionProps) {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const openForm = onOpenCommentForm ?? (() => setIsFormOpen(true));
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['items', itemId, 'comments', sortBy, refreshTrigger ?? 0],
    queryFn: () => fetchItemComments(itemId, sortBy),
    enabled: !!itemId,
  });
  const comments = data?.comments ?? [];
  const commentsEnabled = data?.commentsEnabled ?? true;
  const initialDisplayCount = data?.initialDisplayCount ?? 3;
  const loadMoreCount = data?.loadMoreCount ?? 10;

  const [displayCount, setDisplayCount] = useState(3);
  // Reset display count when data changes
  const visibleComments = comments.slice(0, displayCount);
  const hasMore = comments.length > displayCount;

  const handleLike = async (commentId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
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
                      ? { ...c, isLiked: resData.data.isLiked, likeCount: resData.data.likeCount }
                      : c
                  ),
                }
              : prev
        );
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReport = async (commentId: string) => {
    if (!confirm('آیا می‌خواهید این کامنت را گزارش دهید؟')) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'محتوا نامناسب' }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        setToastMessage('کامنت با موفقیت گزارش شد. از همکاری شما متشکریم!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage(data.error || (response.status === 400 ? 'شما قبلاً این کامنت را گزارش کرده‌اید' : 'خطا در گزارش کامنت'));
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
      setToastMessage('خطا در گزارش کامنت');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsActionLoading(false);
    }
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
      } else {
        alert(resData.error || 'خطا در حذف کامنت');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('خطا در حذف کامنت');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {/* Header — Vibe 2.0: نظرها (count) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h3 className="font-bold text-gray-900">
              نظرها ({comments.length})
            </h3>
          </div>
          {commentsEnabled ? (
            <button
              onClick={openForm}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="نوشتن نظر"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
          ) : (
            <span className="text-sm text-gray-500">
              نظرها برای این آیتم غیرفعال است
            </span>
          )}
        </div>

        {/* Sort: مفیدترین | جدیدترین */}
        {!isLoading && comments.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'popular'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              مفیدترین
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'newest'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              جدیدترین
            </button>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl block mb-2">💬</span>
            <p className="text-gray-600 font-medium">هنوز کسی نظر نداده</p>
            <p className="text-sm text-gray-400 mt-1">
              اولین نظر را تو بنویس ✨
            </p>
            {commentsEnabled && (
              <button
                onClick={openForm}
                className="mt-4 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                نوشتن نظر
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visibleComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onLike={handleLike}
                  onReport={handleReport}
                  onDelete={handleDelete}
                  isLoading={isActionLoading}
                />
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                onClick={() => setDisplayCount((prev) => prev + loadMoreCount)}
                className="w-full mt-4 py-2.5 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors"
              >
                نمایش بیشتر ({comments.length - displayCount} نظر دیگه)
              </button>
            )}
          </>
        )}
      </div>

      {/* Comment Form — وقتی والد فرم را رندر می‌کند (onOpenCommentForm) اینجا فرم نداریم تا نوار دکمه‌ها مخفی بماند */}
      {!onOpenCommentForm && (
        <CommentForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          itemId={itemId}
          onSubmit={() => {
            refetch();
            onCommentAdded?.();
          }}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

