'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flag } from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';
import ReportsPageHeader from '@/components/admin/comments/ReportsPageHeader';
import CommentsSubNav, { type CommentsNavStats } from '@/components/admin/comments/CommentsSubNav';
import ReportsFilterBar from '@/components/admin/comments/ReportsFilterBar';
import ReportsTable from '@/components/admin/comments/ReportsTable';
import CommentDetailsDrawer from '@/components/admin/comments/CommentDetailsDrawer';
import CommentsMobileDetailBar from '@/components/admin/comments/CommentsMobileDetailBar';
import CommentDetailPanel, {
  type ReportDetailRow,
} from '@/components/admin/comments/CommentDetailPanel';
import RejectCommentDialog from '@/components/admin/comments/RejectCommentDialog';
import PenaltyModal from '@/components/admin/comments/PenaltyModal';
import CommentDetailModal from '@/components/admin/comments/CommentDetailModal';
import type { CommentsReportsIntelligenceData } from '@/lib/admin/comments-reports-intelligence';
import type { ReportGroup } from '@/lib/admin/comments-reports-intelligence';
import type { ReportsResolvedFilter } from '@/lib/admin/comments-reports-intelligence';
import { reportGroupToCommentRow } from '@/lib/admin/report-group-to-row';
import type { CommentRowData } from '@/components/admin/comments/CommentRow';

interface ReportsPageClientProps {
  data: CommentsReportsIntelligenceData;
  navStats?: CommentsNavStats;
}

function resolvedToParam(filter: ReportsResolvedFilter): string {
  if (filter === 'open') return 'false';
  if (filter === 'resolved') return 'true';
  return 'all';
}

export default function ReportsPageClient({ data, navStats }: ReportsPageClientProps) {
  const router = useRouter();
  const { groups: reports, pulse, badWords } = data;

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [detailModalComment, setDetailModalComment] = useState<CommentRowData | null>(
    null
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [penaltyModal, setPenaltyModal] = useState<{
    isOpen: boolean;
    commentId: string | null;
    commentContent: string;
    action: 'delete' | 'edit' | 'report' | 'reject';
  }>({
    isOpen: false,
    commentId: null,
    commentContent: '',
    action: 'delete',
  });
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    preview: string;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [discardingId, setDiscardingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setSelectedGroupId((prev) => {
      if (prev && reports.some((g) => g.comment.id === prev)) return prev;
      return reports[0]?.comment.id ?? null;
    });
  }, [reports]);

  const selectedGroup =
    reports.find((g) => g.comment.id === selectedGroupId) ?? null;
  const panelComment = selectedGroup
    ? reportGroupToCommentRow(selectedGroup)
    : null;
  const panelReports: ReportDetailRow[] | undefined = selectedGroup?.reports.map(
    (r) => ({
      id: r.id,
      reason: r.reason,
      resolved: r.resolved,
      createdAt: r.createdAt,
      users: r.users,
    })
  );

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  }, []);

  const applyResolvedFilter = (filter: ReportsResolvedFilter) => {
    const params = new URLSearchParams();
    params.set('resolved', resolvedToParam(filter));
    if (data.pageSize !== 10) params.set('pageSize', String(data.pageSize));
    router.push(`/admin/comments/reports?${params.toString()}`);
  };

  const performApprove = async (commentId: string) => {
    setApprovingId(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا در تایید');
      showToast('کامنت تایید شد', 'success');
      router.refresh();
    } finally {
      setApprovingId(null);
    }
  };

  const handleDiscardReports = async (commentId: string) => {
    setDiscardingId(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}/discard-reports`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا در رد ریپورت');
      showToast('ریپورت‌ها رد شد', 'success');
      router.refresh();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در رد ریپورت', 'error');
    } finally {
      setDiscardingId(null);
    }
  };

  const performDelete = async (commentId: string) => {
    const res = await fetch(`/api/admin/comments?id=${commentId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'خطا در حذف');
    showToast('کامنت حذف شد', 'success');
    setDeleteTarget(null);
    router.refresh();
  };

  const handleApprove = (commentId: string) => {
    const group = reports.find((r) => r.comment.id === commentId);
    if (!group) return;
    setPenaltyModal({
      isOpen: true,
      commentId,
      commentContent: group.comment.content,
      action: 'report',
    });
  };

  const handleDelete = (commentId: string, preview: string) => {
    setDeleteTarget({ id: commentId, preview: preview.slice(0, 120) });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const group = reports.find((r) => r.comment.id === deleteTarget.id);
    if (!group) return;
    setPenaltyModal({
      isOpen: true,
      commentId: deleteTarget.id,
      commentContent: group.comment.content,
      action: 'delete',
    });
    setDeleteTarget(null);
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
        await performDelete(penaltyModal.commentId);
      } else if (penaltyModal.action === 'report') {
        await performApprove(penaltyModal.commentId);
      }

      setPenaltyModal({
        isOpen: false,
        commentId: null,
        commentContent: '',
        action: 'delete',
      });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا در عملیات', 'error');
    } finally {
      setPenaltyLoading(false);
    }
  };

  const handleOpenFullDetail = (comment: CommentRowData) => {
    setDetailModalComment(comment);
    setDetailModalOpen(true);
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    const res = await fetch(`/api/admin/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'خطا');
    showToast('کامنت ویرایش شد', 'success');
    router.refresh();
  };

  const handleDeleteFromModal = async (commentId: string) => {
    await performDelete(commentId);
    setDetailModalOpen(false);
    setDetailModalComment(null);
  };

  const handleApproveFromModal = async (commentId: string) => {
    const group = reports.find((r) => r.comment.id === commentId);
    if (!group) return;
    setPenaltyModal({
      isOpen: true,
      commentId,
      commentContent: group.comment.content,
      action: 'report',
    });
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
      else if (action === 'report') await performApprove(commentId);
      else {
        setDetailModalOpen(false);
        setDetailModalComment(null);
        router.refresh();
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'خطا', 'error');
    } finally {
      setPenaltyLoading(false);
    }
  };

  const filterBadWords = (text: string): string => {
    if (!badWords?.length) return text;
    let out = text;
    badWords.forEach((w) => {
      const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      out = out.replace(re, '*'.repeat(w.length));
    });
    return out;
  };

  const handleSelectGroup = (group: ReportGroup) => {
    setSelectedGroupId(group.comment.id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setDrawerOpen(true);
    }
  };

  const refresh = () => router.refresh();

  return (
    <div dir="rtl">
      <ReportsPageHeader />
      {navStats && <CommentsSubNav stats={navStats} />}

      <ReportsFilterBar
        currentFilter={data.resolved}
        pulse={pulse}
        totalCount={data.totalCount}
        onFilterChange={applyResolvedFilter}
        onRefresh={refresh}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <Flag className="w-12 h-12 mx-auto text-[var(--color-text-muted)] opacity-40 mb-3" />
          <p className="text-[var(--color-text-muted)]">ریپورتی یافت نشد</p>
          {data.resolved !== 'all' && (
            <button
              type="button"
              onClick={() => applyResolvedFilter('all')}
              className="mt-3 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              نمایش همه
            </button>
          )}
        </div>
      ) : (
        <div
          className={`flex flex-col lg:flex-row gap-4 ${
            panelComment ? 'pb-20 lg:pb-0' : ''
          }`}
        >
          <div className="flex-1 min-w-0">
            <ReportsTable
              groups={reports}
              activeCommentId={selectedGroupId}
              onSelect={handleSelectGroup}
              filterBadWords={filterBadWords}
            />
          </div>
          <div className="w-full lg:w-[min(380px,32%)] shrink-0">
            <CommentDetailPanel
              comment={panelComment}
              reports={panelReports}
              reportCount={selectedGroup?.reportCount}
              onApprove={handleApprove}
              onReject={() => {}}
              onDiscardReports={handleDiscardReports}
              showReject={false}
              onDelete={
                panelComment
                  ? (id, preview) => handleDelete(id, preview)
                  : undefined
              }
              onOpenFullDetail={handleOpenFullDetail}
              approvingId={approvingId}
              rejectingId={null}
              discardingId={discardingId}
              filterBadWords={filterBadWords}
              emptyLabel="یک ردیف ریپورت انتخاب کنید"
            />
          </div>
        </div>
      )}

      <RejectCommentDialog
        isOpen={!!deleteTarget}
        preview={deleteTarget?.preview}
        isLoading={penaltyLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <CommentsMobileDetailBar
        visible={!!panelComment && !drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        label="جزئیات ریپورت"
      />

      <CommentDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        comment={panelComment}
        reports={panelReports}
        reportCount={selectedGroup?.reportCount}
        onApprove={handleApprove}
        onReject={() => {}}
        onDiscardReports={handleDiscardReports}
        showReject={false}
        onDelete={
          panelComment
            ? (id, preview) => handleDelete(id, preview)
            : undefined
        }
        onOpenFullDetail={handleOpenFullDetail}
        approvingId={approvingId}
        rejectingId={null}
        discardingId={discardingId}
        filterBadWords={filterBadWords}
        title="جزئیات ریپورت"
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
