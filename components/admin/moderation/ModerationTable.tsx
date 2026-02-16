'use client';

import React, { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { UserPlus, Eye } from 'lucide-react';
import type { ModerationCaseRow } from './types';
import { TYPE_LABELS, ENTITY_LABELS, STATUS_LABELS, SEVERITY_LABELS, TYPE_BADGE_CLASS, STATUS_BADGE_CLASS, SEVERITY_BADGE_CLASS } from './types';

export interface ModerationTableProps {
  cases: ModerationCaseRow[];
  selectedId: string | null;
  onRowClick: (caseId: string) => void;
  onAssignToMe: (caseId: string) => void;
  onOpenDrawer: (caseId: string) => void;
  isReadOnly: boolean;
  actionLoading: string | null;
}

function ModerationTableInner({
  cases,
  selectedId,
  onRowClick,
  onAssignToMe,
  onOpenDrawer,
  isReadOnly,
  actionLoading,
}: ModerationTableProps) {
  return (
    <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
      <table className="w-full text-sm text-right" dir="rtl">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700/80 shadow-sm">
          <tr>
            <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Time</th>
            <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Type</th>
            <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Entity</th>
            <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Reason</th>
            <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Severity</th>
            <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
            <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Assignee</th>
            <th className="p-3 font-medium text-gray-600 dark:text-gray-300 w-28">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((row) => (
            <tr
              key={row.id}
              className={`border-t border-gray-100 dark:border-gray-700 cursor-pointer h-14 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                selectedId === row.id ? 'bg-rose-50 dark:bg-rose-900/20' : ''
              }`}
              onClick={() => onRowClick(row.id)}
            >
              <td className="p-3" title={new Date(row.createdAt).toLocaleString('fa-IR')}>
                {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true, locale: faIR })}
              </td>
              <td className="p-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_CLASS[row.type] ?? 'bg-gray-100 text-gray-700'}`}>
                  {TYPE_LABELS[row.type] ?? row.type}
                </span>
              </td>
              <td className="p-3 max-w-[200px]">
                {row.entityType === 'LIST' && (
                  <>
                    <span className="font-medium truncate block">{row.entityPreview?.title ?? row.entityId}</span>
                    {row.entityPreview?.categoryName && (
                      <span className="text-xs text-gray-500 rounded-full bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5">{row.entityPreview.categoryName}</span>
                    )}
                  </>
                )}
                {row.entityType === 'USER' && (
                  <>
                    <span className="font-medium truncate block">{row.entityPreview?.name ?? row.entityPreview?.email ?? row.entityId}</span>
                    {row.entityPreview?.role && <span className="text-xs text-gray-500 rounded-full bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5">{row.entityPreview.role}</span>}
                  </>
                )}
                {row.entityType === 'COMMENT' && (
                  <span className="truncate block max-w-[180px]" title={row.entityPreview?.body ?? row.reason}>
                    {row.entityPreview?.body ? `${row.entityPreview.body.slice(0, 40)}…` : row.reason}
                  </span>
                )}
                {row.entityType === 'CATEGORY' && (
                  <span className="font-medium">{row.entityPreview?.title ?? row.entityId}</span>
                )}
                {!row.entityPreview && !['LIST', 'USER', 'COMMENT', 'CATEGORY'].includes(row.entityType) && (
                  <span>{ENTITY_LABELS[row.entityType] ?? row.entityType} — {row.entityId.slice(0, 8)}</span>
                )}
              </td>
              <td className="p-3 max-w-[160px] truncate" title={row.reason}>{row.reason}</td>
              <td className="p-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${SEVERITY_BADGE_CLASS[row.severity as 1 | 2 | 3] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>
                  {SEVERITY_LABELS[row.severity] ?? row.severity}
                </span>
              </td>
              <td className="p-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE_CLASS[row.status] ?? ''}`}>
                  {STATUS_LABELS[row.status] ?? row.status}
                </span>
              </td>
              <td className="p-3">
                {row.users ? (
                  <span className="inline-flex items-center gap-1.5">
                    {row.users.image ? <img src={row.users.image} alt="" className="w-6 h-6 rounded-full object-cover" /> : <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs">{row.users.name?.[0] ?? row.users.email?.[0] ?? '?'}</span>}
                    <span className="truncate max-w-[80px]">{row.users.name ?? row.users.email}</span>
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 rounded-full bg-gray-100 dark:bg-gray-600 px-2 py-0.5">Unassigned</span>
                )}
              </td>
              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                {!isReadOnly && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 mr-1"
                    onClick={(ev) => { ev.stopPropagation(); onAssignToMe(row.id); }}
                    disabled={!!actionLoading}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> تخصیص به من
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={(ev) => { ev.stopPropagation(); onOpenDrawer(row.id); }}
                >
                  <Eye className="w-3.5 h-3.5" /> باز کردن
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(ModerationTableInner);
