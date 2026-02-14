'use client';

import { useState, useEffect } from 'react';
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

interface CommentSectionProps {
  itemId: string;
  onCommentAdded?: () => void;
  /** اگر ست شود، دکمه‌های «نوشتن نظر» این را صدا می‌زنند و فرم در والد رندر می‌شود (تا نوار دکمه‌ها مخفی شود). */
  onOpenCommentForm?: () => void;
  /** وقتی والد فرم کامنت را submit می‌کند، این عدد را عوض کن تا کامنت‌ها refetch شوند */
  refreshTrigger?: number;
}

export default function CommentSection({ itemId, onCommentAdded, onOpenCommentForm, refreshTrigger }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const openForm = onOpenCommentForm ?? (() => setIsFormOpen(true));
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [itemId, sortBy]);

  useEffect(() => {
    if (typeof refreshTrigger === 'number' && refreshTrigger > 0) {
      fetchComments();
    }
  }, [refreshTrigger]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/items/${itemId}/comments?sort=${sortBy}`
      );
      const data = await response.json();

      if (data.success) {
        setComments(data.data.comments);
        setCommentsEnabled(data.data.commentsEnabled ?? true);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (commentId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  isLiked: data.data.isLiked,
                  likeCount: data.data.likeCount,
                }
              : comment
          )
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
      const data = await response.json();

      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(data.error || 'خطا در حذف کامنت');
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
          <div className="space-y-3">
            {comments.map((comment) => (
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
        )}
      </div>

      {/* Comment Form — وقتی والد فرم را رندر می‌کند (onOpenCommentForm) اینجا فرم نداریم تا نوار دکمه‌ها مخفی بماند */}
      {!onOpenCommentForm && (
        <CommentForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          itemId={itemId}
          onSubmit={() => {
            fetchComments();
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

