'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  Edit,
  ExternalLink,
  ListIcon,
  Trash2,
  Check,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import Image from 'next/image';

export interface AdminSuggestedItemSuggestion {
  id: string;
  source?: 'form' | 'menu';
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  listId: string;
  status: string;
  createdAt: string;
  lists: {
    id: string;
    title: string;
    slug: string;
    categories: { id: string; name: string; icon: string; slug: string };
  };
  users: { id: string; name: string | null; email: string };
}

interface AdminSuggestedItemCardProps {
  suggestion: AdminSuggestedItemSuggestion;
  processing: boolean;
  onApprove: (suggestion: AdminSuggestedItemSuggestion) => void;
  onReject: (suggestion: AdminSuggestedItemSuggestion) => void;
  onEdit: (suggestion: AdminSuggestedItemSuggestion) => void;
  onDelete: (suggestion: AdminSuggestedItemSuggestion) => void;
  onViewList: (suggestion: AdminSuggestedItemSuggestion) => void;
  isRemoving?: boolean;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
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

export default function AdminSuggestedItemCard({
  suggestion,
  processing,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onViewList,
  isRemoving = false,
  isBulkMode = false,
  isSelected = false,
  onToggleSelect,
}: AdminSuggestedItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const timeAgo = formatRelativeTime(suggestion.createdAt);
  const listTitle = suggestion.lists?.title ?? '';
  const listSlug = suggestion.lists?.slug;
  const suggestedBy = suggestion.users?.name || suggestion.users?.email || 'کاربر';
  const category = suggestion.lists?.categories;
  const description = suggestion.description?.trim();
  const statusCfg = STATUS_LABEL[suggestion.status] ?? STATUS_LABEL.pending;
  const isPending = suggestion.status === 'pending';

  const meta = [
    category?.name,
    listSlug ? null : listTitle || null,
    suggestedBy,
    timeAgo,
  ].filter(Boolean);

  return (
    <article
      className={`rounded-xl border transition-colors ${
        isRemoving ? 'pointer-events-none opacity-60' : ''
      } ${
        isSelected
          ? 'border-primary/40 bg-primary/5'
          : 'border-(--color-border) bg-(--color-surface)'
      }`}
    >
      <div className="flex gap-3 p-4">
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-(--color-bg)">
          {suggestion.imageUrl ? (
            <Image
              src={suggestion.imageUrl}
              alt=""
              width={48}
              height={64}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-wibe-secondary">
              <Package className="size-5" strokeWidth={1.5} />
            </div>
          )}
          {isBulkMode && (
            <button
              type="button"
              onClick={() => onToggleSelect?.(suggestion.id)}
              className={`absolute start-1 top-1 flex size-8 items-center justify-center rounded-full border-2 ${
                isSelected
                  ? 'border-primary bg-primary text-white'
                  : 'border-(--color-border) bg-(--color-surface) text-transparent'
              }`}
              aria-label="انتخاب"
            >
              <Check className="size-4" strokeWidth={2} />
            </button>
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
                {suggestion.source === 'menu' && (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                    منو
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold leading-snug text-(--color-text)">
                {suggestion.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-wibe-secondary">
                {listSlug ? (
                  <Link
                    href={`/lists/${listSlug}`}
                    className="hover:text-primary hover:underline"
                  >
                    {listTitle}
                  </Link>
                ) : null}
                {listSlug && meta.length > 0 ? ' · ' : null}
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
                  <div className="absolute end-0 top-full z-20 mt-1 w-44 rounded-xl border border-(--color-border) bg-(--color-surface) py-1 shadow-lg">
                    {suggestion.source !== 'menu' && (
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
                    )}
                    {suggestion.externalUrl && (
                      <a
                        href={suggestion.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-11 w-full items-center gap-2 px-3 text-sm text-(--color-text) hover:bg-(--color-bg)"
                        onClick={() => setMenuOpen(false)}
                      >
                        <ExternalLink className="size-4" strokeWidth={1.5} /> لینک
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onViewList(suggestion);
                        setMenuOpen(false);
                      }}
                      className="flex min-h-11 w-full items-center gap-2 px-3 text-sm text-(--color-text) hover:bg-(--color-bg)"
                    >
                      <ListIcon className="size-4" strokeWidth={1.5} /> لیست
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
