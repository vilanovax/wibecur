'use client';

import { useState } from 'react';
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
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
  listSlug?: string;
  categorySlug?: string | null;
}

const COMMENTS_PER_PAGE = 10;

interface ListCommentsPage {
  comments: Comment[];
  commentsEnabled: boolean;
  totalCount?: number;
  nextCursor: string | null;
  hasMore: boolean;
}

async function fetchListCommentsPage(
  listId: string,
  sortBy: string,
  cursor: string | null
): Promise<ListCommentsPage> {
  const params = new URLSearchParams({
    sort: sortBy,
    limit: String(COMMENTS_PER_PAGE),
  });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/lists/${listId}/comments?${params.toString()}`);
  const data = await res.json();
  if (!data.success) {
    return { comments: [], commentsEnabled: true, nextCursor: null, hasMore: false };
  }
  return {
    comments: data.data ?? [],
    commentsEnabled: data.commentsEnabled ?? true,
    totalCount: data.totalCount,
    nextCursor: data.nextCursor ?? null,
    hasMore: !!data.hasMore,
  };
}

export default function ListCommentSection({
  listId,
  listSlug,
  categorySlug,
}: ListCommentSectionProps) {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['lists', listId, 'comments', sortBy],
    queryFn: ({ pageParam }) =>
      fetchListCommentsPage(listId, sortBy, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!listId,
  });

  const comments = data?.pages.flatMap((p) => p.comments) ?? [];
  const commentsEnabled = data?.pages[0]?.commentsEnabled ?? true;
  const totalCount = data?.pages[0]?.totalCount ?? comments.length;
  const remainingCount = Math.max(totalCount - comments.length, 0);
  const displayedComments = comments;

  const handleLike = async (commentId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/lists/comments/${commentId}/like`, {
        method: 'POST',
      });
      const resData = await response.json();

      if (resData.success) {
        queryClient.setQueryData<InfiniteData<ListCommentsPage>>(
          ['lists', listId, 'comments', sortBy],
          (prev) =>
            prev
              ? {
                  ...prev,
                  pages: prev.pages.map((page) => ({
                    ...page,
                    comments: page.comments.map((c) =>
                      c.id === commentId
                        ? {
                            ...c,
                            userLiked: resData.data.isLiked,
                            likeCount: resData.data.likeCount,
                          }
                        : c
                    ),
                  })),
                }
              : prev
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
            <h3 className="font-bold text-foreground">
              کامنت‌ها ({totalCount})
            </h3>
          </div>
          {commentsEnabled ? (
            <button
              onClick={() => setIsFormOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200 shadow-sm hover:shadow-md"
              aria-label="افزودن کامنت جدید"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
          ) : (
            <span className="text-sm text-wibe-secondary">
              کامنت‌ها برای این لیست غیرفعال است
            </span>
          )}
        </div>

        {/* Sort Buttons - Only show if there are comments */}
        {!isLoading && comments.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'newest'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
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
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              محبوب‌ترین
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
            <MessageSquare className="w-12 h-12 text-wibe-secondary mx-auto mb-2" />
            <p className="text-wibe-secondary">هنوز کامنتی ثبت نشده است</p>
            <p className="text-sm text-wibe-secondary mt-1">
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
            {hasNextPage && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-foreground rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>نمایش بیشتر</span>
                      {remainingCount > 0 && (
                        <span className="text-sm text-wibe-secondary">
                          ({remainingCount} باقی‌مانده)
                        </span>
                      )}
                    </>
                  )}
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
        listSlug={listSlug}
        categorySlug={categorySlug}
        onSubmit={refetch}
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

