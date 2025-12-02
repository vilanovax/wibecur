'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  isFiltered: boolean;
  createdAt: string;
  items: {
    id: string;
    title: string;
    lists: {
      slug: string;
    };
  };
}

interface CommentsTabProps {
  userId: string;
}

const INITIAL_DISPLAY_LIMIT = 4;

export default function CommentsTab({ userId }: CommentsTabProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [userId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Fetch all comments by user (we'll need to add this API endpoint)
      // For now, we'll use a workaround by checking all items
      const response = await fetch('/api/user/comments');
      const data = await response.json();

      if (data.success) {
        setComments(data.data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('آیا از حذف این کامنت اطمینان دارید؟')) return;

    setDeletingId(commentId);
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
      setDeletingId(null);
    }
  };

  const displayedComments = showAll ? comments : comments.slice(0, INITIAL_DISPLAY_LIMIT);
  const remainingCount = comments.length - INITIAL_DISPLAY_LIMIT;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">هنوز کامنتی نگذاشته‌اید</p>
        <p className="text-sm text-gray-500">
          کامنت‌های خود را در صفحات لیست‌ها مشاهده خواهید کرد
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedComments.map((comment) => (
        <div
          key={comment.id}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p
                className={`text-gray-900 mb-2 ${
                  comment.isFiltered ? 'text-gray-500 italic' : ''
                }`}
              >
                {comment.content}
              </p>
              <Link
                href={`/lists/${comment.items.lists?.slug || '#'}`}
                className="text-sm text-primary hover:underline"
              >
                در: {comment.items.title}
              </Link>
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: faIR,
                })}
              </p>
            </div>
            <button
              onClick={() => handleDelete(comment.id)}
              disabled={deletingId === comment.id}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      {remainingCount > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium mt-4"
        >
          مشاهده {remainingCount} مورد بیشتر
        </button>
      )}
    </div>
  );
}

