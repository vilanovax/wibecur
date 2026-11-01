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
    <div className="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
      <div className="overflow-x-auto max-h-[min(72vh,760px)] overflow-y-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="sticky top-0 z-10 border-b border-(--color-border) bg-(--color-bg)">
            <tr dir="rtl">
              <th className="px-2.5 py-2 text-right text-xs font-semibold text-wibe-secondary w-9">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  aria-label="انتخاب همه"
                  className="rounded border-(--color-border) text-primary focus:ring-(--primary)"
                />
              </th>
              <th
                className={`px-2.5 py-2 text-right text-xs font-semibold text-wibe-secondary ${
                  hideMetaColumns ? 'w-[28%]' : 'w-40'
                }`}
              >
                کاربر
              </th>
              <th className="px-2.5 py-2 text-right text-xs font-semibold text-wibe-secondary">
                متن کامنت
              </th>
              <th
                className={`px-2.5 py-2 text-right text-xs font-semibold text-wibe-secondary ${
                  hideMetaColumns ? 'w-[22%]' : 'w-30'
                }`}
              >
                آیتم
              </th>
              {!hideMetaColumns && (
                <>
                  <th className="px-2.5 py-2 text-right text-xs font-semibold text-wibe-secondary w-22">
                    تاریخ
                  </th>
                  <th className="px-2.5 py-2 text-right text-xs font-semibold text-wibe-secondary w-27.5">
                    وضعیت
                  </th>
                  <th className="px-2.5 py-2 text-right text-xs font-semibold text-wibe-secondary w-24">
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
