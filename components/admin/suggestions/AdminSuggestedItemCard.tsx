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
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
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
  pending: { label: 'در انتظار', className: 'bg-amber-50 text-amber-700' },
  approved: { label: 'تأیید شده', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'رد شده', className: 'bg-red-50 text-red-700' },
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

  const timeAgo = formatDistanceToNow(new Date(suggestion.createdAt), {
    addSuffix: true,
    locale: faIR,
  });
  const listTitle = suggestion.lists?.title ?? '';
  const listSlug = suggestion.lists?.slug;
  const suggestedBy = suggestion.users?.name || suggestion.users?.email || 'کاربر';
  const category = suggestion.lists?.categories;
  const description = suggestion.description?.trim();
  const statusCfg = STATUS_LABEL[suggestion.status] ?? STATUS_LABEL.pending;
  const isPending = suggestion.status === 'pending';

  return (
    <article
      className={`group rounded-xl border transition-all ${
        isRemoving ? 'opacity-60 pointer-events-none' : ''
      } ${
        isSelected
          ? 'border-violet-300 bg-violet-50/40 ring-1 ring-violet-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex gap-3 p-3 md:p-4">
        {/* پوستر */}
        <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100 md:h-16 md:w-12">
          {suggestion.imageUrl ? (
            <Image
              src={suggestion.imageUrl}
              alt=""
              width={48}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <Package className="h-5 w-5" />
            </div>
          )}
          {isBulkMode && (
            <button
              type="button"
              onClick={() => onToggleSelect?.(suggestion.id)}
              className={`absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] ${
                isSelected
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-gray-300 bg-white text-transparent'
              }`}
              aria-label="انتخاب"
            >
              <Check className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* محتوا */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-gray-900">{suggestion.title}</h3>
              <p className="mt-0.5 truncate text-sm text-gray-500">
                {listSlug ? (
                  <Link href={`/lists/${listSlug}`} className="hover:text-violet-600 hover:underline">
                    {listTitle}
                  </Link>
                ) : (
                  listTitle
                )}
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
              {suggestion.source === 'menu' && (
                <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                  منو
                </span>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                  aria-label="گزینه‌ها"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                    <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                      {suggestion.source !== 'menu' && (
                        <button
                          type="button"
                          onClick={() => { onEdit(suggestion); setMenuOpen(false); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" /> ویرایش
                        </button>
                      )}
                      {suggestion.externalUrl && (
                        <a
                          href={suggestion.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          <ExternalLink className="h-4 w-4" /> لینک
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => { onViewList(suggestion); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <ListIcon className="h-4 w-4" /> لیست
                      </button>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => { onDelete(suggestion); setMenuOpen(false); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
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
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{description}</p>
          )}

          {category?.name && (
            <span className="mt-2 inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {category.icon} {category.name}
            </span>
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
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
