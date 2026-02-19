'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CommentsToolbar from '@/components/admin/comments/CommentsToolbar';
import BulkActionBar from '@/components/admin/comments/BulkActionBar';
import CommentsTable from '@/components/admin/comments/CommentsTable';
import CommentDetailsDrawer from '@/components/admin/comments/CommentDetailsDrawer';
import PenaltyModal from '@/components/admin/comments/PenaltyModal';
import CommentDetailModal from '@/components/admin/comments/CommentDetailModal';
import type { CommentRowData } from '@/components/admin/comments/CommentRow';

interface Comment extends CommentRowData {
  updatedAt?: string;
}

interface CommentsPageClientProps {
  comments: Comment[];
  totalCount: number;
  currentFilter: string;
  currentSearch: string;
  badWords?: string[];
  currentPage?: number;
  totalPages?: number;
}

export default function CommentsPageClient({
  comments = [],
  totalCount,
  currentFilter,
  currentSearch,
  badWords = [],
}: CommentsPageClientProps) {
  const router = useRouter();
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [filter, setFilter] = useState(currentFilter);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [drawerComment, setDrawerComment] = useState<CommentRowData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailModalComment, setDetailModalComment] = useState<Comment | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [penaltyModal, setPenaltyModal] = useState<{
    isOpen: boolean;
    commentId: string | null;
    commentContent: string;
    action: 'delete' | 'edit' | 'report';
  }>({ isOpen: false, commentId: null, commentContent: '', action: 'delete' });
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<'approve' | 'reject' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const filterBadWords = useCallback(
    (text: string) => {
      if (!badWords?.length) return text;
      let out = text;
      badWords.forEach((w) => {
        const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        out = out.replace(re, '*'.repeat(w.length));
      });
      return out;
    },
    [badWords]
  );

  const refresh = useCallback(() => {
    router.refresh();
    setLocalComments(comments);
  }, [router, comments]);

  const handleFilterChange = (newFilter: string) => setFilter(newFilter);

  const handleSearchSubmit = (search: string) => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (search) params.set('search', search);
    router.push(`/admin/comments?${params.toString()}`);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    const selectable = localComments.filter((c) => !c.deletedAt);
    setSelectedIds(checked ? new Set(selectable.map((c) => c.id)) : new Set());
  };

  const handleView = (comment: CommentRowData) => {
    setDrawerComment(comment);
    setDrawerOpen(true);
  };

  const handleOpenFullDetail = (comment: CommentRowData) => {
    const full = localComments.find((c) => c.id === comment.id);
    if (full) {
      setDetailModalComment(full);
      setDetailModalOpen(true);
      setDrawerOpen(false);
      setDrawerComment(null);
    }
  };

  const performApprove = useCallback(
    async (id: string) => {
      setApprovingId(id);
      try {
        const res = await fetch(`/api/admin/comments/${id}/approve`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'خطا');
        setLocalComments((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, isApproved: true, isFiltered: false } : c
          )
        );
        showToast('کامنت تایید شد');
        router.refresh();
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'خطا در تایید');
      } finally {
        setApprovingId(null);
      }
    },
    [router, showToast]
  );

  const performReject = useCallback(
    async (id: string) => {
      setRejectingId(id);
      try {
        const res = await fetch(`/api/admin/comments/${id}/reject`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'خطا');
        setLocalComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isApproved: false } : c))
        );
        showToast('کامنت رد شد');
        router.refresh();
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'خطا در رد');
      } finally {
        setRejectingId(null);
      }
    },
    [router, showToast]
  );

  const handleApprove = (id: string) => {
    const comment = localComments.find((c) => c.id === id);
    if (!comment) return;
    if (comment.isFiltered || comment._count.comment_reports > 0) {
      setPenaltyModal({
        isOpen: true,
        commentId: id,
        commentContent: comment.content,
        action: 'report',
      });
      return;
    }
    performApprove(id);
  };

  const handleReject = (id: string) => {
    if (!confirm('آیا از رد این کامنت اطمینان دارید؟')) return;
    performReject(id);
  };

  const handleBulkApprove = () => setBulkConfirm('approve');
  const handleBulkReject = () => setBulkConfirm('reject');

  const confirmBulkAction = async () => {
    if (!bulkConfirm || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/comments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkConfirm,
          ids: Array.from(selectedIds),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'خطا');
      showToast(
        bulkConfirm === 'approve' ? 'کامنت‌ها تایید شدند' : 'کامنت‌ها رد شدند'
      );
      setSelectedIds(new Set());
      setBulkConfirm(null);
      router.refresh();
      setLocalComments(comments);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در عملیات گروهی');
    } finally {
      setBulkLoading(false);
    }
  };

  const handlePenaltySubmit = async (score: number) => {
    if (!penaltyModal.commentId) return;
    setPenaltyLoading(true);
    try {
      const penaltyRes = await fetch(
        `/api/admin/comments/${penaltyModal.commentId}/penalty`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            penaltyScore: score,
            action: penaltyModal.action,
          }),
        }
      );
      const penaltyData = await penaltyRes.json();
      if (!penaltyRes.ok || !penaltyData.success)
        throw new Error(penaltyData.error || 'خطا');
      if (penaltyModal.action === 'delete') {
        const res = await fetch(
          `/api/admin/comments?id=${penaltyModal.commentId}`,
          { method: 'DELETE' }
        );
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'خطا');
        setLocalComments((prev) =>
          prev.filter((c) => c.id !== penaltyModal.commentId)
        );
        showToast('کامنت حذف شد');
      } else if (penaltyModal.action === 'report') {
        await performApprove(penaltyModal.commentId);
      }
      setPenaltyModal({
        isOpen: false,
        commentId: null,
        commentContent: '',
        action: 'delete',
      });
      router.refresh();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ثبت امتیاز');
    } finally {
      setPenaltyLoading(false);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    const res = await fetch(`/api/admin/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'خطا');
    setLocalComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, content: newContent, isFiltered: false }
          : c
      )
    );
    if (detailModalComment?.id === commentId)
      setDetailModalComment({
        ...detailModalComment,
        content: newContent,
        isFiltered: false,
      });
    router.refresh();
  };

  const handleDeleteFromModal = async (commentId: string) => {
    const res = await fetch(`/api/admin/comments?id=${commentId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'خطا');
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    setDetailModalOpen(false);
    setDetailModalComment(null);
    showToast('کامنت حذف شد');
    router.refresh();
  };

  const handleApproveFromModal = async (commentId: string) => {
    await performApprove(commentId);
    setDetailModalOpen(false);
    setDetailModalComment(null);
  };

  const handlePenaltyFromModal = async (
    commentId: string,
    score: number,
    action: string
  ) => {
    setPenaltyLoading(true);
    try {
      const penaltyRes = await fetch(`/api/admin/comments/${commentId}/penalty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penaltyScore: score, action }),
      });
      const penaltyData = await penaltyRes.json();
      if (!penaltyRes.ok || !penaltyData.success)
        throw new Error(penaltyData.error || 'خطا');
      if (action === 'delete') await handleDeleteFromModal(commentId);
      else if (action === 'report') await handleApproveFromModal(commentId);
      else {
        setDetailModalOpen(false);
        setDetailModalComment(null);
        router.refresh();
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ثبت امتیاز');
    } finally {
      setPenaltyLoading(false);
    }
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">مدیریت کامنت‌ها</h1>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl bg-slate-800 text-white text-sm shadow-lg">
          {toast}
        </div>
      )}

      <CommentsToolbar
        currentFilter={filter}
        currentSearch={currentSearch}
        totalCount={totalCount}
        onFilterChange={handleFilterChange}
        onSearchSubmit={handleSearchSubmit}
        onRefresh={refresh}
      />

      <BulkActionBar
        selectedCount={selectedIds.size}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onClearSelection={() => setSelectedIds(new Set())}
        isLoading={bulkLoading}
      />

      {localComments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <p className="text-slate-600 mb-2">کامنتی یافت نشد</p>
          <p className="text-sm text-slate-500">
            فیلترها یا عبارت جستجو را تغییر دهید.
          </p>
        </div>
      ) : (
        <CommentsTable
          comments={localComments}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onView={handleView}
          onApprove={handleApprove}
          onReject={handleReject}
          approvingId={approvingId}
          rejectingId={rejectingId}
          filterBadWords={filterBadWords}
        />
      )}

      <CommentDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerComment(null);
        }}
        comment={drawerComment}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpenFullDetail={handleOpenFullDetail}
        approvingId={approvingId}
        rejectingId={rejectingId}
      />

      {bulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <p className="text-slate-800 font-medium mb-4">
              {bulkConfirm === 'approve'
                ? `تایید ${selectedIds.size} کامنت؟`
                : `رد ${selectedIds.size} کامنت؟`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulkConfirm(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmBulkAction}
                disabled={bulkLoading}
                className={`flex-1 py-2 rounded-xl text-white ${
                  bulkConfirm === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {bulkLoading ? 'در حال انجام...' : 'تایید'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      <CommentDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailModalComment(null);
        }}
        comment={detailModalComment}
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
