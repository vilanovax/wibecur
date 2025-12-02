'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, CheckCircle, XCircle, Flag, Filter, Eye, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import PenaltyModal from '@/components/admin/comments/PenaltyModal';
import CommentDetailModal from '@/components/admin/comments/CommentDetailModal';

interface Comment {
  id: string;
  content: string;
  isFiltered: boolean;
  isApproved: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  items: {
    id: string;
    title: string;
  };
  _count: {
    comment_reports: number;
  };
}

interface CommentsPageClientProps {
  comments: Comment[];
  currentFilter: string;
  currentSearch: string;
  badWords?: string[];
}

export default function CommentsPageClient({
  comments = [],
  currentFilter,
  currentSearch,
  badWords = [],
}: CommentsPageClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState(currentFilter || 'all');
  const [search, setSearch] = useState(currentSearch || '');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [penaltyModal, setPenaltyModal] = useState<{
    isOpen: boolean;
    commentId: string | null;
    commentContent: string;
    action: 'delete' | 'edit' | 'report';
  }>({
    isOpen: false,
    commentId: null,
    commentContent: '',
    action: 'delete',
  });
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Update local comments when props change (e.g., after refresh)
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // Helper function to replace bad words with asterisks
  const filterBadWords = (text: string): string => {
    if (!badWords || badWords.length === 0) return text;
    
    let filteredText = text;
    badWords.forEach((badWord) => {
      // Create regex that matches the bad word (case insensitive)
      const regex = new RegExp(badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(badWord.length));
    });
    
    return filteredText;
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    const params = new URLSearchParams();
    if (newFilter !== 'all') params.set('filter', newFilter);
    if (search) params.set('search', search);
    router.push(`/admin/comments?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (search) params.set('search', search);
    router.push(`/admin/comments?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این کامنت اطمینان دارید؟')) return;

    // Find comment to show in penalty modal
    const comment = localComments.find((c) => c.id === id);
    if (!comment) return;

    // Show penalty modal for filtered/reported comments
    if (comment.isFiltered || comment._count.comment_reports > 0) {
      setPenaltyModal({
        isOpen: true,
        commentId: id,
        commentContent: comment.content,
        action: 'delete',
      });
      return;
    }

    // Delete without penalty for normal comments
    await performDelete(id);
  };

  const performDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete');
      }

      // Update local state immediately
      setLocalComments((prev) => prev.filter((comment) => comment.id !== id));

      // Force a full page reload to ensure deleted comments are removed
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(error.message || 'خطا در حذف کامنت');
      setDeletingId(null);
    }
  };

  const handlePenaltySubmit = async (score: number) => {
    if (!penaltyModal.commentId) return;

    setPenaltyLoading(true);
    try {
      // Submit penalty
      const penaltyRes = await fetch(
        `/api/admin/comments/${penaltyModal.commentId}/penalty`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            penaltyScore: score,
            action: penaltyModal.action,
          }),
        }
      );

      const penaltyData = await penaltyRes.json();

      if (!penaltyRes.ok || !penaltyData.success) {
        throw new Error(penaltyData.error || 'Failed to submit penalty');
      }

      // Perform the action (delete, edit, or approve)
      if (penaltyModal.action === 'delete') {
        await performDelete(penaltyModal.commentId);
      } else if (penaltyModal.action === 'report') {
        await performApprove(penaltyModal.commentId);
      }

      // Close modal
      setPenaltyModal({
        isOpen: false,
        commentId: null,
        commentContent: '',
        action: 'delete',
      });
    } catch (error: any) {
      console.error('Error submitting penalty:', error);
      alert(error.message || 'خطا در ثبت امتیاز');
    } finally {
      setPenaltyLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    // Find comment to check if it needs penalty
    const comment = localComments.find((c) => c.id === id);
    if (!comment) return;

    // Show penalty modal for filtered/reported comments
    if (comment.isFiltered || comment._count.comment_reports > 0) {
      setPenaltyModal({
        isOpen: true,
        commentId: id,
        commentContent: comment.content,
        action: 'report',
      });
      return;
    }

    // Approve without penalty for normal comments
    await performApprove(id);
  };

  const performApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}/approve`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve');
      }

      // Update local state immediately for better UX
      setLocalComments((prev) =>
        prev.map((comment) =>
          comment.id === id
            ? { ...comment, isApproved: true, isFiltered: false }
            : comment
        )
      );

      // Refresh server data
      router.refresh();
    } catch (error: any) {
      console.error('Error approving comment:', error);
      alert(error.message || 'خطا در تایید کامنت');
    } finally {
      setApprovingId(null);
    }
  };

  const handleCommentClick = (comment: Comment) => {
    setSelectedComment(comment);
    setIsDetailModalOpen(true);
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update comment');
      }

      // Update local state
      setLocalComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, content: newContent, isFiltered: false }
            : comment
        )
      );

      // Update selected comment
      if (selectedComment?.id === commentId) {
        setSelectedComment({
          ...selectedComment,
          content: newContent,
          isFiltered: false,
        });
      }

      router.refresh();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteFromModal = async (commentId: string) => {
    await performDelete(commentId);
    setIsDetailModalOpen(false);
    setSelectedComment(null);
  };

  const handleApproveFromModal = async (commentId: string) => {
    await performApprove(commentId);
    setIsDetailModalOpen(false);
    setSelectedComment(null);
  };

  const handlePenaltyFromModal = async (
    commentId: string,
    score: number,
    action: string
  ) => {
    setPenaltyLoading(true);
    try {
      // Submit penalty
      const penaltyRes = await fetch(`/api/admin/comments/${commentId}/penalty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          penaltyScore: score,
          action: action,
        }),
      });

      const penaltyData = await penaltyRes.json();

      if (!penaltyRes.ok || !penaltyData.success) {
        throw new Error(penaltyData.error || 'Failed to submit penalty');
      }

      // Perform the action based on type
      if (action === 'delete') {
        await handleDeleteFromModal(commentId);
      } else if (action === 'edit') {
        // Already edited, just close modal
        setIsDetailModalOpen(false);
        setSelectedComment(null);
      } else if (action === 'report') {
        await handleApproveFromModal(commentId);
      }

      router.refresh();
    } catch (error: any) {
      console.error('Error submitting penalty:', error);
      alert(error.message || 'خطا در ثبت امتیاز');
    } finally {
      setPenaltyLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">مدیریت کامنت‌ها</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در کامنت‌ها..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </form>

          {/* Filter Chips */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'همه', icon: Filter },
              { id: 'approved', label: 'تایید شده', icon: CheckCircle },
              { id: 'filtered', label: 'کلمات بد', icon: AlertTriangle },
              { id: 'reported', label: 'ریپورت شده', icon: Flag },
            ].map((filterOption) => {
              const Icon = filterOption.icon;
              return (
                <button
                  key={filterOption.id}
                  onClick={() => handleFilterChange(filterOption.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === filterOption.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filterOption.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {localComments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">کامنتی یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {filter === 'approved' ? (
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                      متن کامنت
                    </th>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                        کاربر
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                        آیتم
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                        تاریخ
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                        وضعیت
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                        عملیات
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {localComments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleCommentClick(comment)}>
                    {filter === 'approved' ? (
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {comment.isFiltered
                            ? filterBadWords(comment.content)
                            : comment.content}
                        </p>
                        {comment.isFiltered && (
                          <span className="mt-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            فیلتر شده
                          </span>
                        )}
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {comment.users.image ? (
                              <img
                                src={comment.users.image}
                                alt={comment.users.name || 'User'}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary text-xs font-medium">
                                  {(comment.users.name || comment.users.email)[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {comment.users.name || 'بدون نام'}
                              </p>
                              <p className="text-xs text-gray-500">{comment.users.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {comment.items.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: faIR,
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {comment.isFiltered && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                فیلتر شده
                              </span>
                            )}
                            {comment.isApproved ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                تایید شده
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                در انتظار تایید
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleCommentClick(comment)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="مشاهده کامنت"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Penalty Modal */}
      <PenaltyModal
        isOpen={penaltyModal.isOpen}
        onClose={() =>
          setPenaltyModal({
            isOpen: false,
            commentId: null,
            commentContent: '',
            action: 'delete',
          })
        }
        onSubmit={handlePenaltySubmit}
        commentContent={penaltyModal.commentContent}
        action={penaltyModal.action}
        isLoading={penaltyLoading}
      />

      {/* Comment Detail Modal */}
      <CommentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedComment(null);
        }}
        comment={selectedComment}
        badWords={badWords}
        onEdit={handleEditComment}
        onDelete={handleDeleteFromModal}
        onApprove={handleApproveFromModal}
        onPenaltySubmit={handlePenaltyFromModal}
        isLoading={penaltyLoading}
      />
    </div>
  );
}

