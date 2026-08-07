'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, Flag, Trash2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import CommentAvatar from '@/components/shared/CommentAvatar';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { COMMENT_CLAMP_CHAR_THRESHOLD } from '@/lib/comment-limits';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    isFiltered: boolean;
    helpfulUp: number;
    helpfulDown: number;
    userVote: number | null;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      username?: string | null;
      image: string | null;
      curatorLevel?: string | null;
      avatarType?: string | null;
      avatarId?: string | null;
      avatarStatus?: string | null;
    };
    canDelete: boolean;
  };
  onVote: (commentId: string, value: 1 | -1) => void;
  onReport: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  isLoading?: boolean;
}

function CommentMoreMenu({ onReport, onDelete }: { onReport: () => void; onDelete?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-full text-wibe-secondary hover:text-wibe-secondary hover:bg-wibe-surface transition-colors"
        aria-label="گزینه‌های بیشتر"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="گزینه‌های نظر">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onReport();
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-right"
          >
            <Flag className="w-4 h-4 flex-shrink-0" />
            گزارش نظر
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-right"
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              حذف نظر
            </button>
          )}
        </div>
      </BottomSheet>
    </>
  );
}

export default function CommentItem({
  comment,
  onVote,
  onReport,
  onDelete,
  isLoading = false,
}: CommentItemProps) {
  const [localUp, setLocalUp] = useState(comment.helpfulUp ?? 0);
  const [localDown, setLocalDown] = useState(comment.helpfulDown ?? 0);
  const [localVote, setLocalVote] = useState<number | null>(comment.userVote ?? null);
  const [expanded, setExpanded] = useState(false);

  const showReadMore = comment.content.length > COMMENT_CLAMP_CHAR_THRESHOLD;
  const profileUrl = comment.user.username ? `/u/${encodeURIComponent(comment.user.username)}` : null;

  const handleVote = (value: 1 | -1) => {
    const prev = localVote;
    if (prev === value) return;
    setLocalVote(value);
    if (prev === 1) setLocalUp((u) => Math.max(0, u - 1));
    else if (prev === -1) setLocalDown((d) => Math.max(0, d - 1));
    if (value === 1) setLocalUp((u) => u + 1);
    else setLocalDown((d) => d + 1);
    onVote(comment.id, value);
  };

  const handleDelete = () => {
    if (confirm('آیا از حذف این نظر اطمینان دارید؟')) {
      onDelete(comment.id);
    }
  };

  return (
    <div className="flex gap-3 rounded-xl border border-wibe bg-wibe-card px-3 py-3.5 shadow-sm">
      <div className="flex-shrink-0">
        {profileUrl ? (
          <Link href={profileUrl} className="block">
            <CommentAvatar
              src={comment.user.image}
              name={comment.user.name}
              email={comment.user.email}
              size={40}
              avatarType={comment.user.avatarType ?? undefined}
              avatarId={comment.user.avatarId ?? null}
              avatarStatus={comment.user.avatarStatus ?? null}
            />
          </Link>
        ) : (
          <CommentAvatar
            src={comment.user.image}
            name={comment.user.name}
            email={comment.user.email}
            size={40}
            avatarType={comment.user.avatarType ?? undefined}
            avatarId={comment.user.avatarId ?? null}
            avatarStatus={comment.user.avatarStatus ?? null}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            {profileUrl ? (
              <Link href={profileUrl} className="font-medium text-foreground text-sm hover:text-primary transition-colors">
                {comment.user.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground text-sm">{comment.user.name}</span>
            )}
            <span className="text-xs text-wibe-secondary">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: faIR })}
            </span>
          </div>
          <CommentMoreMenu
            onReport={() => onReport(comment.id)}
            onDelete={comment.canDelete ? handleDelete : undefined}
          />
        </div>

        <div className="relative">
          <p
            className={`text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap ${
              comment.isFiltered ? 'text-wibe-secondary italic' : ''
            } ${!expanded && showReadMore ? 'line-clamp-3' : ''}`}
          >
            {comment.content}
          </p>
          {!expanded && showReadMore && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-wibe-card to-transparent"
              aria-hidden
            />
          )}
        </div>
        {showReadMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 wibe-caption font-semibold text-primary hover:underline"
          >
            {expanded ? 'کمتر' : 'بیشتر بخوان'}
          </button>
        )}

        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => handleVote(1)}
            disabled={isLoading}
            aria-label={`مفید بود${localUp > 0 ? `، ${localUp} رأی` : ''}`}
            className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
              localVote === 1 ? 'text-green-600 font-medium' : 'text-wibe-secondary hover:text-green-600'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${localVote === 1 ? 'fill-current' : ''}`} />
            {localUp > 0 && <span className="tabular-nums">{localUp.toLocaleString('fa-IR')}</span>}
          </button>
          <button
            type="button"
            onClick={() => handleVote(-1)}
            disabled={isLoading}
            aria-label={`مفید نبود${localDown > 0 ? `، ${localDown} رأی` : ''}`}
            className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
              localVote === -1 ? 'text-amber-600 font-medium' : 'text-wibe-secondary hover:text-amber-600'
            }`}
          >
            <ThumbsDown className={`w-4 h-4 ${localVote === -1 ? 'fill-current' : ''}`} />
            {localDown > 0 && <span className="tabular-nums">{localDown.toLocaleString('fa-IR')}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
