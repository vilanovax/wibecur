'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { CommentRowData } from './CommentRow';
import CommentDetailPanel, { type ReportDetailRow } from './CommentDetailPanel';

interface CommentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comment: CommentRowData | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDiscardReports?: (id: string) => void;
  onOpenFullDetail?: (comment: CommentRowData) => void;
  onDelete?: (commentId: string, preview: string) => void;
  approvingId: string | null;
  rejectingId: string | null;
  discardingId?: string | null;
  filterBadWords?: (text: string) => string;
  reports?: ReportDetailRow[];
  reportCount?: number;
  showReject?: boolean;
  title?: string;
}

export default function CommentDetailsDrawer({
  isOpen,
  onClose,
  comment,
  onApprove,
  onReject,
  onDiscardReports,
  onOpenFullDetail,
  onDelete,
  approvingId,
  rejectingId,
  discardingId,
  filterBadWords,
  reports,
  reportCount,
  showReject = true,
  title = 'جزئیات کامنت',
}: CommentDetailsDrawerProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed top-0 left-0 z-50 w-full max-w-md h-full lg:hidden">
        <div className="h-full flex flex-col bg-[var(--color-surface)] shadow-xl">
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--color-bg)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CommentDetailPanel
            comment={comment}
            reports={reports}
            reportCount={reportCount}
            onApprove={onApprove}
            onReject={onReject}
            onDiscardReports={onDiscardReports}
            onOpenFullDetail={onOpenFullDetail}
            onDelete={onDelete}
            approvingId={approvingId}
            rejectingId={rejectingId}
            discardingId={discardingId}
            filterBadWords={filterBadWords}
            showReject={showReject}
            className="flex-1 border-0 rounded-none shadow-none min-h-0"
          />
        </div>
      </aside>
    </>
  );
}
