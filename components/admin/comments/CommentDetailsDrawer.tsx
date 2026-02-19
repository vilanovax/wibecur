'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, CheckCircle, XCircle, ExternalLink, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import type { CommentRowData } from './CommentRow';

interface CommentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comment: CommentRowData | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpenFullDetail?: (comment: CommentRowData) => void;
  approvingId: string | null;
  rejectingId: string | null;
}

export default function CommentDetailsDrawer({
  isOpen,
  onClose,
  comment,
  onApprove,
  onReject,
  onOpenFullDetail,
  approvingId,
  rejectingId,
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
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed top-0 left-0 z-50 w-full max-w-md h-full bg-white shadow-xl overflow-y-auto transition-transform duration-300 ease-out"
        style={{ direction: 'rtl' }}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">جزئیات کامنت</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {!comment ? (
            <p className="text-slate-500">کامنتی انتخاب نشده</p>
          ) : (
            <>
              <div>
                <p className="text-xs text-slate-500 mb-1">متن کامنت</p>
                <p className="text-sm text-slate-900 whitespace-pre-wrap bg-slate-50 rounded-xl p-4">
                  {comment.content}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">کاربر</p>
                <div className="flex items-center gap-2">
                  {comment.users.image ? (
                    <img
                      src={comment.users.image}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium">
                      {(comment.users.name || comment.users.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-900">
                      {comment.users.name || 'بدون نام'}
                    </p>
                    <p className="text-xs text-slate-500">{comment.users.email}</p>
                  </div>
                  <Link
                    href={`/admin/users?id=${comment.users.id}`}
                    className="mr-auto p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    صفحه کاربر
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">آیتم</p>
                <Link
                  href={`/admin/items?id=${comment.items.id}`}
                  className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1"
                >
                  {comment.items.title}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: faIR,
                })}
              </p>
              {comment._count.comment_reports > 0 && (
                <p className="text-xs text-rose-600">
                  ریپورت شده ({comment._count.comment_reports})
                </p>
              )}
              {onOpenFullDetail && (
                <button
                  type="button"
                  onClick={() => onOpenFullDetail(comment)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  جزئیات کامل و ویرایش / حذف
                </button>
              )}
              {!comment.deletedAt && (
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => onApprove(comment.id)}
                    disabled={
                      approvingId === comment.id ||
                      rejectingId === comment.id ||
                      comment.isApproved
                    }
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    تایید
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(comment.id)}
                    disabled={approvingId === comment.id || rejectingId === comment.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    رد
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
