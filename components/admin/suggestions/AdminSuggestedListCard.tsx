'use client';

import { useState } from 'react';
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import Image from 'next/image';

export interface AdminSuggestedListSuggestion {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  categoryId: string;
  userId?: string;
  status: string;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
  categories: { id: string; name: string; icon: string };
  users: { id: string; name: string | null; email: string };
}

interface AdminSuggestedListCardProps {
  suggestion: AdminSuggestedListSuggestion;
  processing?: boolean;
  onApprove: (suggestion: AdminSuggestedListSuggestion) => void;
  onReject: (suggestion: AdminSuggestedListSuggestion) => void;
  onEdit: (suggestion: AdminSuggestedListSuggestion) => void;
  onDelete: (suggestion: AdminSuggestedListSuggestion) => void;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: 'در انتظار', className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
  approved: { label: 'تأیید شده', className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
  rejected: { label: 'رد شده', className: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
};

export default function AdminSuggestedListCard({
  suggestion,
  processing = false,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: AdminSuggestedListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const timeAgo = formatRelativeTime(suggestion.createdAt);
  const suggestedBy = suggestion.users?.name || suggestion.users?.email || 'کاربر';
  const statusCfg = STATUS_LABEL[suggestion.status] ?? STATUS_LABEL.pending;
  const isPending = suggestion.status === 'pending';
  const description = suggestion.description?.trim();

  return (
    <article className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all hover:border-gray-300 hover:shadow-sm">
      <div className="flex gap-3 p-3 md:p-4">
        <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-violet-50 dark:bg-violet-900/20 text-xl md:h-16 md:w-12">
          {suggestion.coverImage ? (
            <Image
              src={suggestion.coverImage}
              alt=""
              width={48}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{suggestion.categories?.icon || '📋'}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">{suggestion.title}</h3>
              <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                {suggestion.categories?.name || 'بدون دسته'}
                <span className="mx-1.5 text-gray-300">·</span>
                {suggestedBy}
                <span className="mx-1.5 text-gray-300">·</span>
                {timeAgo}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
              <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                پیشنهاد لیست
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                  aria-label="گزینه‌ها"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                    <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => { onEdit(suggestion); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4" /> ویرایش
                      </button>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => { onDelete(suggestion); setMenuOpen(false); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" /> حذف
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
          )}

          {isPending && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => onApprove(suggestion)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 md:flex-none md:px-5"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                تأیید
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => onReject(suggestion)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                رد
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
