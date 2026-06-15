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
}: CommentsTableProps) {
  const selectableComments = comments.filter((c) => !c.deletedAt);
  const allSelected =
    selectableComments.length > 0 &&
    selectableComments.every((c) => selectedIds.has(c.id));

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <table className="w-full min-w-[800px]">
        <thead className="bg-slate-50 dark:bg-gray-800/60 border-b border-slate-200 dark:border-gray-700">
          <tr style={{ direction: 'rtl' }}>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-gray-300 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-slate-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
              />
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-gray-300">
              کاربر
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-gray-300 max-w-[220px]">
              متن کامنت
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-gray-300">
              آیتم
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-gray-300">
              تاریخ
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-gray-300">
              وضعیت
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-gray-300">
              عملیات
            </th>
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
