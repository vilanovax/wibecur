'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Loader2, TrendingUp, Clock } from 'lucide-react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

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
    image: string | null;
  };
  isLiked: boolean;
  canDelete: boolean;
}

interface CommentSectionProps {
  itemId: string;
}

export default function CommentSection({ itemId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [itemId, sortBy]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/items/${itemId}/comments?sort=${sortBy}`
      );
      const data = await response.json();

      if (data.success) {
        setComments(data.data.comments);
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
      const data = await response.json();

      if (data.success) {
        alert('کامنت با موفقیت گزارش شد');
      } else {
        alert(data.error || 'خطا در گزارش کامنت');
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
      alert('خطا در گزارش کامنت');
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-gray-900">
              کامنت‌ها ({comments.length})
            </h3>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            کامنت جدید
          </button>
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

      {/* Comment Form */}
      <CommentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        itemId={itemId}
        onSubmit={fetchComments}
      />
    </>
  );
}

