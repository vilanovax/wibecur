'use client';

import { useState } from 'react';
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  List,
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
  pending: {
    label: 'در انتظار',
    className: 'bg-amber-50 text-amber-800',
  },
  approved: {
    label: 'تأیید شده',
    className: 'bg-emerald-50 text-emerald-800',
  },
  rejected: {
    label: 'رد شده',
    className: 'bg-red-50 text-red-800',
  },
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
  const meta = [
    suggestion.categories?.name || 'بدون دسته',
    suggestedBy,
    timeAgo,
  ].filter(Boolean);

  return (
    <article className="rounded-xl border border-(--color-border) bg-(--color-surface)">
      <div className="flex gap-3 p-4">
        <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-(--color-bg)">
          {suggestion.coverImage ? (
            <Image
              src={suggestion.coverImage}
              alt=""
              width={48}
              height={64}
              className="size-full object-cover"
            />
          ) : (
            <List className="size-5 text-wibe-secondary" strokeWidth={1.5} />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-sm font-medium ${statusCfg.className}`}
                >
                  {statusCfg.label}
                </span>
                <span className="rounded-md bg-sky-50 px-2 py-0.5 text-sm font-medium text-sky-800">
                  پیشنهاد لیست
                </span>
              </div>
              <h3 className="text-base font-bold leading-snug text-(--color-text)">
                {suggestion.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-wibe-secondary">
                {meta.join(' · ')}
              </p>
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-wibe-secondary hover:bg-(--color-bg)"
                aria-label="گزینه‌ها"
              >
                <MoreVertical className="size-4" strokeWidth={1.5} />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute end-0 top-full z-20 mt-1 w-40 rounded-xl border border-(--color-border) bg-(--color-surface) py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        onEdit(suggestion);
                        setMenuOpen(false);
                      }}
                      className="flex min-h-11 w-full items-center gap-2 px-3 text-sm text-(--color-text) hover:bg-(--color-bg)"
                    >
                      <Edit className="size-4" strokeWidth={1.5} /> ویرایش
                    </button>
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(suggestion);
                          setMenuOpen(false);
                        }}
                        className="flex min-h-11 w-full items-center gap-2 px-3 text-sm text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="size-4" strokeWidth={1.5} /> حذف
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-wibe-secondary">
              {description}
            </p>
          ) : null}

          {isPending && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => onApprove(suggestion)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 sm:flex-none"
              >
                {processing ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                ) : (
                  <CheckCircle className="size-4" strokeWidth={2} />
                )}
                تأیید
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => onReject(suggestion)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="size-4" strokeWidth={1.5} />
                رد
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
