'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Toast, { type ToastType } from '@/components/shared/Toast';
import CommentsPageHeader from '@/components/admin/comments/CommentsPageHeader';
import CommentsSubNav, { type CommentsNavStats } from '@/components/admin/comments/CommentsSubNav';
import CommentsFilterBar from '@/components/admin/comments/CommentsFilterBar';
import CommentDetailPanel from '@/components/admin/comments/CommentDetailPanel';
import BulkActionBar from '@/components/admin/comments/BulkActionBar';
import { useCommentsKeyboardShortcuts } from '@/hooks/useCommentsKeyboardShortcuts';
import BulkConfirmDialog from '@/components/admin/comments/BulkConfirmDialog';
import RejectCommentDialog from '@/components/admin/comments/RejectCommentDialog';
import CommentsTable from '@/components/admin/comments/CommentsTable';
import CommentDetailsDrawer from '@/components/admin/comments/CommentDetailsDrawer';
import CommentsMobileDetailBar from '@/components/admin/comments/CommentsMobileDetailBar';
import PenaltyModal from '@/components/admin/comments/PenaltyModal';
import CommentDetailModal from '@/components/admin/comments/CommentDetailModal';
import type { CommentRowData } from '@/components/admin/comments/CommentRow';
import type { CommentsIntelligenceData } from '@/lib/admin/comments-intelligence';
import type { CommentSortKind } from '@/lib/admin/comments-intelligence';
import type { CommentFilterKind } from '@/lib/admin/comments-filter-utils';

interface Comment extends CommentRowData {
  updatedAt?: string;
}

interface CommentsPageClientProps {
  data: CommentsIntelligenceData;
  navStats?: CommentsNavStats;
}

export default function CommentsPageClient({ data, navStats }: CommentsPageClientProps) {
  const router = useRouter();
  const [localComments, setLocalComments] = useState<Comment[]>(data.comments);
  const [filter, setFilter] = useState<CommentFilterKind>(data.filter);
  const [sort, setSort] = useState<CommentSortKind>(data.sort);
  const [search, setSearch] = useState(data.search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailModalComment, setDetailModalComment] = useState<Comment | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [penaltyModal, setPenaltyModal] = useState<{
    isOpen: boolean;
    commentId: string | null;
    commentContent: string;
    action: 'delete' | 'edit' | 'report' | 'reject';
  }>({ isOpen: false, commentId: null, commentContent: '', action: 'delete' });
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<'approve' | 'reject' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    preview: string;
  } | null>(null);

  const { pulse, badWords, totalCount } = data;

  useEffect(() => {
    setLocalComments(data.comments);
    setFilter(data.filter);
    setSort(data.sort);
    setSearch(data.search);
    setSelectedId((prev) => {
      if (prev && data.comments.some((c) => c.id === prev)) return prev;
      return data.comments[0]?.id ?? null;
    });
  }, [data]);

  const { pageSize } = data;

  const syncUrl = useCallback(
    (opts: {
      filter?: CommentFilterKind;
      search?: string;
      sort?: CommentSortKind;
      page?: string;
    }) => {
      const params = new URLSearchParams();
      const nextFilter = opts.filter ?? filter;
      const nextSearch = opts.search ?? search;
      const nextSort = opts.sort ?? sort;

      if (nextFilter !== 'pending') params.set('filter', nextFilter);
      if (nextSearch.trim()) params.set('search', nextSearch.trim());
      if (nextSort !== 'created_desc') params.set('sort', nextSort);
      if (opts.page && opts.page !== '1') params.set('page', opts.page);
      if (pageSize !== 10) params.set('pageSize', String(pageSize));

      const qs = params.toString();
      router.push(qs ? `/admin/comments/all?${qs}` : '/admin/comments/all');
    },
    [filter, search, sort, pageSize, router]
  );

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
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
  }, [router]);

  const handleFilterChange = (newFilter: string) => {
    const next = newFilter as CommentFilterKind;
    setFilter(next);
    syncUrl({ filter: next, page: '1' });
  };

  const handleSortChange = (next: CommentSortKind) => {
    setSort(next);
    syncUrl({ sort: next, page: '1' });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    syncUrl({ search: value, page: '1' });
  };

  const panelComment =
    localComments.find((c) => c.id === selectedId) ?? null;

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

  const selectComment = useCallback((comment: CommentRowData) => {
    setSelectedId(comment.id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setDrawerOpen(true);
    }
  }, []);

  const handleView = (comment: CommentRowData) => {
    selectComment(comment);
  };

  const handleOpenFullDetail = (comment: CommentRowData) => {
    const full = localComments.find((c) => c.id === comment.id);
    if (full) {
      setDetailModalComment(full);
      setDetailModalOpen(true);
      setDrawerOpen(false);
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
        showToast('کامنت تایید شد', 'success');
        router.refresh();
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'خطا در تایید', 'error');
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
        showToast('کامنت رد شد', 'success');
        setRejectTarget(null);
        router.refresh();
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'خطا در رد', 'error');
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
    const comment = localComments.find((c) => c.id === id);
    setRejectTarget({
      id,
      preview: comment?.content?.slice(0, 120) ?? '',
    });
  };

  useCommentsKeyboardShortcuts({
    enabled: localComments.length > 0,
    comments: localComments,
    selectedId,
    onSelectId: (id) => {
      setSelectedId(id);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setDrawerOpen(true);
      }
    },
    onApprove: handleApprove,
    onReject: handleReject,
  });

  const confirmReject = () => {
    if (!rejectTarget) return;
    const comment = localComments.find((c) => c.id === rejectTarget.id);
    setPenaltyModal({
      isOpen: true,
      commentId: rejectTarget.id,
      commentContent: comment?.content ?? rejectTarget.preview,
      action: 'reject',
    });
    setRejectTarget(null);
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
        bulkConfirm === 'approve' ? 'کامنت‌ها تایید شدند' : 'کامنت‌ها رد شدند',
        'success'
      );
      setSelectedIds(new Set());
      setBulkConfirm(null);
      router.refresh();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در عملیات گروهی', 'error');
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
        showToast('کامنت حذف شد', 'success');
      } else if (penaltyModal.action === 'report') {
        await performApprove(penaltyModal.commentId);
      } else if (penaltyModal.action === 'reject') {
        await performReject(penaltyModal.commentId);
      }
      setPenaltyModal({
        isOpen: false,
        commentId: null,
        commentContent: '',
        action: 'delete',
      });
      router.refresh();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در ثبت امتیاز', 'error');
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
    showToast('کامنت حذف شد', 'success');
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
      showToast(e instanceof Error ? e.message : 'خطا در ثبت امتیاز', 'error');
    } finally {
      setPenaltyLoading(false);
    }
  };

  return (
    <div dir="rtl">
      <CommentsPageHeader />
      {navStats && <CommentsSubNav stats={navStats} />}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      <CommentsFilterBar
        currentFilter={filter}
        currentSearch={search}
        currentSort={sort}
        totalCount={totalCount}
        pulse={pulse}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        onRefresh={refresh}
      />

      <div
        className={`flex flex-col lg:flex-row gap-4 ${
          selectedIds.size > 0 ? 'pb-28' : panelComment ? 'pb-20 lg:pb-0' : ''
        }`}
      >
        <div className="flex-1 min-w-0">
      {localComments.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm p-12 text-center">
          <p className="text-[var(--color-text)] mb-2">کامنتی یافت نشد</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            فیلترها یا عبارت جستجو را تغییر دهید.
          </p>
          {(filter !== 'pending' || search || sort !== 'created_desc') && (
            <button
              type="button"
              onClick={() => {
                setFilter('pending');
                setSort('created_desc');
                setSearch('');
                router.push('/admin/comments/all?filter=pending');
              }}
              className="mt-4 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      ) : (
        <CommentsTable
          comments={localComments}
          selectedIds={selectedIds}
          activeId={selectedId}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onView={handleView}
          onRowClick={selectComment}
          onApprove={handleApprove}
          onReject={handleReject}
          approvingId={approvingId}
          rejectingId={rejectingId}
          filterBadWords={filterBadWords}
        />
      )}
        </div>

        <div className="hidden lg:block w-[min(380px,32%)] shrink-0">
          <CommentDetailPanel
            comment={panelComment}
            onApprove={handleApprove}
            onReject={handleReject}
            onOpenFullDetail={handleOpenFullDetail}
            approvingId={approvingId}
            rejectingId={rejectingId}
            filterBadWords={filterBadWords}
          />
        </div>
      </div>

      <CommentsMobileDetailBar
        visible={!!panelComment && !drawerOpen && selectedIds.size === 0}
        onOpen={() => setDrawerOpen(true)}
      />

      <BulkActionBar
        selectedCount={selectedIds.size}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onClearSelection={() => setSelectedIds(new Set())}
        isLoading={bulkLoading}
      />

      <CommentDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        comment={panelComment}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpenFullDetail={handleOpenFullDetail}
        approvingId={approvingId}
        rejectingId={rejectingId}
        filterBadWords={filterBadWords}
      />

      <BulkConfirmDialog
        isOpen={!!bulkConfirm}
        action={bulkConfirm ?? 'approve'}
        count={selectedIds.size}
        isLoading={bulkLoading}
        onCancel={() => setBulkConfirm(null)}
        onConfirm={confirmBulkAction}
      />

      <RejectCommentDialog
        isOpen={!!rejectTarget}
        preview={rejectTarget?.preview}
        isLoading={rejectingId === rejectTarget?.id}
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
      />

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
