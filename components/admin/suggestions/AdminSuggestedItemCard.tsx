'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Calendar,
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

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: {
      label: 'در انتظار',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    approved: {
      label: 'تأیید شده',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    rejected: {
      label: 'رد شده',
      className: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-500',
    },
  };
  const c = config[status as keyof typeof config] || config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'pending' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
}

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
  const [descExpanded, setDescExpanded] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true, locale: faIR });
  const categoryName = suggestion.lists?.categories?.name ?? null;
  const listSlug = suggestion.lists?.slug;
  const listTitle = suggestion.lists?.title ?? '';
  const suggestedByName = suggestion.users?.name || suggestion.users?.email || '—';
  const description = suggestion.description?.trim() || null;
  const showExpand = description && description.length > 120;

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isBulkMode || !onToggleSelect) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="menu"]')) return;
    onToggleSelect(suggestion.id);
  };

  return (
    <div
      role={isBulkMode ? 'button' : undefined}
      tabIndex={isBulkMode ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (isBulkMode && onToggleSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onToggleSelect(suggestion.id);
        }
      }}
      className={`bg-white rounded-xl border shadow-sm transition-all duration-300 ${
        isRemoving ? 'opacity-60 pointer-events-none' : ''
      } ${
        isBulkMode ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
          : 'border-gray-100'
      }`}
    >
      {/* Header Row — RTL */}
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          {isBulkMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.(suggestion.id);
              }}
              className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-primary border-primary text-white'
                  : 'border-gray-300 bg-white hover:border-primary/50'
              }`}
              aria-label={isSelected ? 'لغو انتخاب' : 'انتخاب'}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
            </button>
          )}
          <StatusBadge status={suggestion.status} />
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="منو"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 left-auto top-full mt-1 z-20 w-48 py-1 bg-white rounded-xl border border-gray-200 shadow-lg min-w-[11rem]">
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(suggestion);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-right"
                  >
                    <Edit className="w-4 h-4" />
                    ویرایش
                  </button>
                  {suggestion.externalUrl && (
                    <a
                      href={suggestion.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-right"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      مشاهده آیتم
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onViewList(suggestion);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-right"
                  >
                    <ListIcon className="w-4 h-4" />
                    مشاهده لیست
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(suggestion);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-right"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف کامل
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 text-base truncate">{suggestion.title}</h3>
          <Link
            href={listSlug ? `/lists/${listSlug}` : '#'}
            className="text-sm text-primary hover:underline mt-0.5 block truncate"
          >
            برای لیست: {listTitle}
          </Link>
        </div>
      </div>

      {/* Body Row — Thumbnail + Description */}
      <div className="flex gap-3 px-4 pb-3">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
          {suggestion.imageUrl ? (
            <Image
              src={suggestion.imageUrl}
              alt={suggestion.title}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="w-7 h-7" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {description ? (
            <div className="text-sm text-gray-600 leading-relaxed">
              <p className={descExpanded ? '' : 'line-clamp-2'}>
                {description}
              </p>
              {showExpand && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((e) => !e)}
                  className="text-xs text-primary hover:underline mt-0.5"
                >
                  {descExpanded ? 'نمایش کمتر' : 'نمایش بیشتر'}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">بدون توضیح</p>
          )}
        </div>
      </div>

      {/* Meta Row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          {suggestedByName}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {timeAgo}
        </span>
        {categoryName && (
          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{categoryName}</span>
        )}
      </div>

      {/* Action Row — فقط برای pending */}
      {suggestion.status === 'pending' && (
        <div className="flex items-center gap-2 p-4 pt-0 border-t border-gray-100">
          <button
            type="button"
            disabled={processing}
            onClick={() => onApprove(suggestion)}
            className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 flex-1"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            تأیید
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={() => onReject(suggestion)}
            className="h-10 px-4 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            رد
          </button>
        </div>
      )}
    </div>
  );
}
