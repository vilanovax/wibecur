'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Loader2, TrendingUp, Clock } from 'lucide-react';
import ListCommentItem from './ListCommentItem';
import ListCommentForm from './ListCommentForm';
import Toast from '@/components/shared/Toast';

interface Comment {
  id: string;
  content: string;
  isFiltered: boolean;
  likeCount: number;
  createdAt: string;
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  userLiked: boolean;
}

interface ListCommentSectionProps {
  listId: string;
}

const COMMENTS_PER_PAGE = 10;

export default function ListCommentSection({ listId }: ListCommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [displayedComments, setDisplayedComments] = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount] = useState(COMMENTS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [listId, sortBy]);

  // Update displayed comments when comments or visibleCount changes
  useEffect(() => {
    setDisplayedComments(comments.slice(0, visibleCount));
  }, [comments, visibleCount]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/lists/${listId}/comments?sort=${sortBy}`
      );
      const data = await response.json();

      if (data.success) {
        setComments(data.data);
        setCommentsEnabled(data.commentsEnabled ?? true);
        // Reset visible count when fetching new comments
        setVisibleCount(COMMENTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching list comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (commentId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/lists/comments/${commentId}/like`, {
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
                  userLiked: data.data.isLiked,
                  likeCount: data.data.likeCount,
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Error liking list comment:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReport = async (commentId: string) => {
    if (!confirm('آیا می‌خواهید این کامنت را گزارش دهید؟')) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/lists/comments/${commentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'محتوا نامناسب' }),
      });
      const data = await response.json();

      if (data.success) {
        setToastMessage('کامنت با موفقیت گزارش شد. از همکاری شما متشکریم!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage(data.error || 'خطا در گزارش کامنت');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error reporting list comment:', error);
      setToastMessage('خطا در گزارش کامنت');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-900">
              کامنت‌ها ({comments.length})
            </h3>
          </div>
          {commentsEnabled ? (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              کامنت جدید
            </button>
          ) : (
            <span className="text-sm text-gray-500">
              کامنت‌ها برای این لیست غیرفعال است
            </span>
          )}
        </div>

        {/* Sort Buttons */}
        <div className="flex gap-2 mb-4">
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
          <button
            onClick={() => setSortBy('popular')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'popular'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            محبوب‌ترین
          </button>
        </div>

        {/* Comments List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">هنوز کامنتی ثبت نشده است</p>
            <p className="text-sm text-gray-400 mt-1">
              اولین کسی باشید که کامنت می‌گذارد
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayedComments.map((comment) => (
                <ListCommentItem
                  key={comment.id}
                  comment={comment}
                  onLike={handleLike}
                  onReport={handleReport}
                  isLoading={isActionLoading}
                />
              ))}
            </div>
            {comments.length > visibleCount && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + COMMENTS_PER_PAGE)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <span>نمایش بیشتر</span>
                  <span className="text-sm text-gray-500">
                    ({comments.length - visibleCount} باقی‌مانده)
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comment Form */}
      <ListCommentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        listId={listId}
        onSubmit={fetchComments}
      />

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

