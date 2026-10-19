'use client';

import type { CommentRowData } from './CommentRow';
import CommentRow from './CommentRow';

interface CommentsTableProps {
  comments: CommentRowData[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onView: (comment: CommentRowData) => void;
  onRowClick?: (comment: CommentRowData) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approvingId: string | null;
  rejectingId: string | null;
  filterBadWords?: (text: string) => string;
  activeId?: string | null;
  /** When detail panel is beside the table, hide redundant columns */
  hideMetaColumns?: boolean;
}

export default function CommentsTable({
  comments,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onView,
  onRowClick,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
  filterBadWords,
  activeId,
  hideMetaColumns = false,
}: CommentsTableProps) {
  const selectableComments = comments.filter((c) => !c.deletedAt);
  const allSelected =
    selectableComments.length > 0 &&
    selectableComments.every((c) => selectedIds.has(c.id));

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="overflow-x-auto max-h-[min(72vh,760px)] overflow-y-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <tr dir="rtl">
              <th className="px-2.5 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)] w-9">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  aria-label="انتخاب همه"
                  className="rounded border-[var(--color-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </th>
              <th
                className={`px-2.5 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)] ${
                  hideMetaColumns ? 'w-[28%]' : 'w-[160px]'
                }`}
              >
                کاربر
              </th>
              <th className="px-2.5 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)]">
                متن کامنت
              </th>
              <th
                className={`px-2.5 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)] ${
                  hideMetaColumns ? 'w-[22%]' : 'w-[120px]'
                }`}
              >
                آیتم
              </th>
              {!hideMetaColumns && (
                <>
                  <th className="px-2.5 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)] w-[88px]">
                    تاریخ
                  </th>
                  <th className="px-2.5 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)] w-[110px]">
                    وضعیت
                  </th>
                  <th className="px-2.5 py-2 text-right text-xs font-semibold text-[var(--color-text-muted)] w-[96px]">
                    عملیات
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                isSelected={selectedIds.has(comment.id)}
                isActive={activeId === comment.id}
                onToggleSelect={onToggleSelect}
                onView={onView}
                onRowClick={onRowClick}
                onApprove={onApprove}
                onReject={onReject}
                approvingId={approvingId}
                rejectingId={rejectingId}
                filterBadWords={filterBadWords}
                hideMetaColumns={hideMetaColumns}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
