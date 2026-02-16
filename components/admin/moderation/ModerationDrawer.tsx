'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import {
  ChevronLeft,
  Loader2,
  UserPlus,
  CheckCircle,
  XCircle,
  MessageSquarePlus,
  Trash2,
  UserX,
  UserCheck,
  RotateCcw,
  ThumbsUp,
} from 'lucide-react';
import AdminReadOnlyBanner from '@/components/admin/AdminReadOnlyBanner';
import type { ModerationCaseDetail, EntityPreview } from './types';
import { TYPE_LABELS, ENTITY_LABELS, STATUS_LABELS, SEVERITY_LABELS } from './types';

interface ModerationDrawerProps {
  open: boolean;
  caseId: string | null;
  detail: ModerationCaseDetail | null;
  detailLoading: boolean;
  entityPreview: EntityPreview | null;
  previewLoading: boolean;
  noteText: string;
  onNoteTextChange: (v: string) => void;
  onClose: () => void;
  isReadOnly: boolean;
  actionLoading: string | null;
  onAssign: (caseId: string) => void;
  onStatus: (caseId: string, status: string) => void;
  onNoteSubmit: (caseId: string, body: string) => void;
  onTrashList: (caseId: string, entityId: string) => void;
  onRestoreList: (entityId: string) => void;
  onSuspendUser: (caseId: string, entityId: string) => void;
  onUnsuspendUser: (caseId: string, entityId: string) => void;
  onCommentApprove: (caseId: string, commentId: string) => void;
  onCommentDelete: (caseId: string, commentId: string) => void;
}

export default function ModerationDrawer({
  open,
  caseId,
  detail,
  detailLoading,
  entityPreview,
  previewLoading,
  noteText,
  onNoteTextChange,
  onClose,
  isReadOnly,
  actionLoading,
  onAssign,
  onStatus,
  onNoteSubmit,
  onTrashList,
  onRestoreList,
  onSuspendUser,
  onUnsuspendUser,
  onCommentApprove,
  onCommentDelete,
}: ModerationDrawerProps) {
  const isResolved = detail?.status === 'RESOLVED' || detail?.status === 'IGNORED';
  const disableDestructive = isResolved;

  if (!open) return null;

  return (
    <div
      className="w-full max-w-[480px] border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 overflow-hidden flex flex-col shadow-sm transition-all duration-200 ease-in-out"
      style={{ minHeight: '400px' }}
      dir="rtl"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">جزئیات مورد</h3>
        <button type="button" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200" onClick={onClose} aria-label="بستن">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {isReadOnly && (
          <div className="rounded-t-2xl">
            <AdminReadOnlyBanner />
          </div>
        )}
        {detailLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : detail ? (
          <>

            {/* SECTION A — Entity Preview */}
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">پیش‌نمایش موجودیت</h4>
              {previewLoading ? (
                <div className="py-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : entityPreview ? (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-sm space-y-2 shadow-sm">
                  {entityPreview.kind === 'LIST' && (
                    <>
                      <p className="font-medium text-gray-900 dark:text-white">{entityPreview.title || entityPreview.slug || '—'}</p>
                      {entityPreview.categories && <p className="text-gray-500">دسته: {entityPreview.categories.name}</p>}
                      <p className="text-gray-500">ذخیره: {entityPreview.saveCount} · لایک: {entityPreview.likeCount} · آیتم: {entityPreview.itemCount}</p>
                      {entityPreview.deletedAt && <span className="inline-block rounded-full px-2 py-0.5 text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/40">In Trash</span>}
                    </>
                  )}
                  {entityPreview.kind === 'USER' && (
                    <>
                      <p className="font-medium text-gray-900 dark:text-white">{entityPreview.name || entityPreview.email}</p>
                      <p className="text-gray-500">نقش: {entityPreview.role} · {entityPreview.isActive ? 'فعال' : 'غیرفعال'}</p>
                      {entityPreview.deletedAt && <span className="inline-block rounded-full px-2 py-0.5 text-xs bg-rose-100 text-rose-800">حذف‌شده</span>}
                    </>
                  )}
                  {entityPreview.kind === 'COMMENT' && (
                    <>
                      <p className="text-gray-700 dark:text-gray-300">{entityPreview.content}</p>
                      {entityPreview.users && <p className="text-xs text-gray-500">نویسنده: {entityPreview.users.name ?? entityPreview.users.email}</p>}
                      <p className="text-xs text-gray-500">تایید: {entityPreview.isApproved ? 'بله' : 'خیر'}</p>
                      {entityPreview.deletedAt && <span className="inline-block rounded-full px-2 py-0.5 text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/40">حذف‌شده</span>}
                    </>
                  )}
                  {entityPreview.kind === 'CATEGORY' && <p className="font-medium text-gray-900 dark:text-white">{entityPreview.name}</p>}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-700/50">
                  <span className="text-xs rounded-full px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40">Entity not found</span>
                  <p className="text-sm text-gray-500 mt-2">موجودیت: {ENTITY_LABELS[detail.entityType]} — {detail.entityId}</p>
                </div>
              )}
            </section>

            {/* SECTION B — Case Info */}
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">اطلاعات مورد</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-500">Case ID</dt><dd className="font-mono text-gray-900 dark:text-gray-100 truncate" title={detail.id}>{detail.id.slice(0, 12)}…</dd>
                <dt className="text-gray-500">نوع</dt><dd>{TYPE_LABELS[detail.type] ?? detail.type}</dd>
                <dt className="text-gray-500">شدت</dt><dd>{SEVERITY_LABELS[detail.severity] ?? detail.severity}</dd>
                <dt className="text-gray-500">وضعیت</dt><dd>{STATUS_LABELS[detail.status] ?? detail.status}</dd>
                <dt className="text-gray-500">تعداد گزارش</dt><dd>{detail.reportCount}</dd>
                <dt className="text-gray-500">ایجاد</dt><dd>{new Date(detail.createdAt).toLocaleString('fa-IR')}</dd>
                <dt className="text-gray-500">بروزرسانی</dt><dd>{new Date(detail.updatedAt).toLocaleString('fa-IR')}</dd>
              </dl>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300"><strong>دلیل:</strong> {detail.reason}</p>
            </section>

            {/* SECTION C — Notes */}
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">یادداشت‌ها</h4>
              <div className="space-y-2 mb-3">
                {detail.notes?.length ? detail.notes.map((n) => (
                  <div key={n.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-sm shadow-sm">
                    <p>{n.body}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.users?.name ?? n.users?.email} — {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: faIR })}</p>
                  </div>
                )) : <p className="text-sm text-gray-500">یادداشتی نیست.</p>}
              </div>
              {!isReadOnly && (
                <div className="flex gap-2">
                  <textarea className="flex-1 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm min-h-[80px] shadow-sm" placeholder="یادداشت داخلی..." value={noteText} onChange={(e) => onNoteTextChange(e.target.value)} />
                  <button type="button" className="px-3 py-2 rounded-2xl border text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1 self-end shadow-sm" disabled={!noteText.trim() || actionLoading === `note-${detail.id}`} onClick={() => onNoteSubmit(detail.id, noteText.trim())}>
                    {actionLoading === `note-${detail.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
                    ذخیره
                  </button>
                </div>
              )}
            </section>

            {/* SECTION D — Actions */}
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">اقدامات</h4>
              {!isReadOnly && (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button type="button" className="px-3 py-1.5 rounded-full border text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1 shadow-sm" disabled={!!actionLoading} onClick={() => onAssign(detail.id)}>
                      {actionLoading === `assign-${detail.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      تخصیص به من
                    </button>
                    <button type="button" className="px-3 py-1.5 rounded-full border text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 shadow-sm" disabled={!!actionLoading} onClick={() => onStatus(detail.id, 'IN_REVIEW')}>در حال بررسی</button>
                    <button type="button" className="px-3 py-1.5 rounded-full border text-sm bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50 shadow-sm" disabled={!!actionLoading} onClick={() => onStatus(detail.id, 'RESOLVED')}><CheckCircle className="w-4 h-4 inline ml-1" /> حل شد</button>
                    <button type="button" className="px-3 py-1.5 rounded-full border text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 shadow-sm" disabled={!!actionLoading} onClick={() => onStatus(detail.id, 'IGNORED')}><XCircle className="w-4 h-4 inline ml-1" /> نادیده</button>
                  </div>
                  {detail.entityType === 'LIST' && !disableDestructive && (
                    <div className="flex gap-2 flex-wrap">
                      {entityPreview?.kind === 'LIST' && !entityPreview.deletedAt && (
                        <button type="button" className="px-3 py-1.5 rounded-full text-sm bg-rose-100 text-rose-800 hover:bg-rose-200 disabled:opacity-50 flex items-center gap-1 shadow-sm" disabled={!!actionLoading} onClick={() => onTrashList(detail.id, detail.entityId)}>
                          {actionLoading?.startsWith('entity-trash-list') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          انتقال به زباله‌دان
                        </button>
                      )}
                      {entityPreview?.kind === 'LIST' && entityPreview.deletedAt && (
                        <button type="button" className="px-3 py-1.5 rounded-full text-sm bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50 flex items-center gap-1 shadow-sm" disabled={!!actionLoading} onClick={() => onRestoreList(detail.entityId)}>
                          {actionLoading?.startsWith('entity-restore-list') ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                          بازگردانی لیست
                        </button>
                      )}
                    </div>
                  )}
                  {detail.entityType === 'USER' && entityPreview?.kind === 'USER' && !disableDestructive && (
                    <div className="flex gap-2 flex-wrap">
                      {entityPreview.isActive && (
                        <button type="button" className="px-3 py-1.5 rounded-full text-sm bg-rose-100 text-rose-800 hover:bg-rose-200 disabled:opacity-50 flex items-center gap-1 shadow-sm" disabled={!!actionLoading} onClick={() => onSuspendUser(detail.id, detail.entityId)}>
                          {actionLoading?.startsWith('entity-suspend-user') ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                          تعلیق کاربر
                        </button>
                      )}
                      {!entityPreview.isActive && (
                        <button type="button" className="px-3 py-1.5 rounded-full text-sm bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50 flex items-center gap-1 shadow-sm" disabled={!!actionLoading} onClick={() => onUnsuspendUser(detail.id, detail.entityId)}>
                          {actionLoading?.startsWith('entity-unsuspend-user') ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                          فعال‌سازی کاربر
                        </button>
                      )}
                    </div>
                  )}
                  {detail.entityType === 'COMMENT' && entityPreview?.kind === 'COMMENT' && !disableDestructive && (
                    <div className="flex gap-2 flex-wrap">
                      {!entityPreview.deletedAt && (
                        <>
                          {!entityPreview.isApproved && (
                            <button type="button" className="px-3 py-1.5 rounded-full text-sm bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50 flex items-center gap-1 shadow-sm" disabled={!!actionLoading} onClick={() => onCommentApprove(detail.id, detail.entityId)}>
                              {actionLoading?.startsWith('entity-comment-approve') ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                              تایید کامنت
                            </button>
                          )}
                          <button type="button" className="px-3 py-1.5 rounded-full text-sm bg-rose-100 text-rose-800 hover:bg-rose-200 disabled:opacity-50 flex items-center gap-1 shadow-sm" disabled={!!actionLoading} onClick={() => onCommentDelete(detail.id, detail.entityId)}>
                            {actionLoading?.startsWith('entity-comment-delete') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            حذف کامنت
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          <p className="text-sm text-gray-500">مورد یافت نشد.</p>
        )}
      </div>
    </div>
  );
}
