'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Loader2, ChevronDown, ThumbsUp, ThumbsDown, Flag, Send, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Toast from '@/components/shared/Toast';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import CuratorBadge from '@/components/shared/CuratorBadge';
import CommentAvatar from '@/components/shared/CommentAvatar';
import {
  COMMENT_CLAMP_CHAR_THRESHOLD,
  COMMENTS_INITIAL_VISIBLE,
  COMMENTS_LOAD_MORE_STEP,
  DEFAULT_LIST_COMMENT_MAX_LENGTH,
  DEFAULT_SUGGESTION_MAX_LENGTH,
  MIN_COMMENT_LENGTH,
} from '@/lib/comment-limits';

const INITIAL_VISIBLE = COMMENTS_INITIAL_VISIBLE;

const REACTION_PILLS = [
  { type: 'meh', label: 'معمولی', emoji: '😊' },
  { type: 'night', label: 'مناسب شب', emoji: '🌙' },
  { type: 'cry', label: 'احساسی', emoji: '😭' },
  { type: 'love', label: 'عاشقانه', emoji: '💖' },
] as const;

interface CommentUser {
  id: string;
  name: string | null;
  email: string;
  username?: string | null;
  image: string | null;
  curatorLevel?: string | null;
  avatarType?: string | null;
  avatarId?: string | null;
  avatarStatus?: string | null;
}

interface Reply {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  users: CommentUser;
  userLiked: boolean;
  likeCount: number;
  helpfulUp?: number;
  helpfulDown?: number;
  userVote?: number | null;
}

interface Comment {
  id: string;
  content: string;
  type: string;
  suggestionStatus: string | null;
  approvedItemId: string | null;
  helpfulUp: number;
  helpfulDown: number;
  userVote: number | null;
  isFiltered: boolean;
  likeCount: number;
  createdAt: string;
  users: CommentUser;
  userLiked: boolean;
  replies: Reply[];
}

interface VibeCommentSectionProps {
  listId: string;
  isOwner: boolean;
  categorySlug?: string | null;
  /** وقتی کاربر روی «پیشنهاد» کلیک می‌کند، این فراخوانی می‌شود (مثلاً برای باز کردن مودال جستجو-محور) */
  onOpenSuggestItem?: () => void;
}

interface VibeCommentsResponse {
  comments: Comment[];
  commentsEnabled: boolean;
  maxCommentLength: number;
  suggestionMaxLength: number;
}

interface ReactionsResponse {
  counts: Record<string, number>;
  userReaction: string | null;
}

async function fetchVibeComments(listId: string, sortParam: string): Promise<VibeCommentsResponse> {
  const res = await fetch(`/api/lists/${listId}/comments?sort=${sortParam}`);
  const data = await res.json();
  if (!data.success) {
    return {
      comments: [],
      commentsEnabled: true,
      maxCommentLength: DEFAULT_LIST_COMMENT_MAX_LENGTH,
      suggestionMaxLength: DEFAULT_SUGGESTION_MAX_LENGTH,
    };
  }
  return {
    comments: data.data ?? [],
    commentsEnabled: data.commentsEnabled ?? true,
    maxCommentLength: data.maxCommentLength ?? DEFAULT_LIST_COMMENT_MAX_LENGTH,
    suggestionMaxLength: data.suggestionMaxLength ?? DEFAULT_SUGGESTION_MAX_LENGTH,
  };
}

async function fetchReactions(listId: string): Promise<ReactionsResponse> {
  const res = await fetch(`/api/lists/${listId}/reactions`);
  const data = await res.json();
  if (!data.success) return { counts: { love: 0, cry: 0, night: 0, meh: 0, suggestion: 0 }, userReaction: null };
  return {
    counts: data.data?.counts ?? { love: 0, cry: 0, night: 0, meh: 0, suggestion: 0 },
    userReaction: data.data?.userReaction ?? null,
  };
}

function ReactionPills({
  counts,
  userReaction,
  onSelect,
  isLoading,
}: {
  counts: Record<string, number>;
  userReaction: string | null;
  onSelect: (type: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_PILLS.map((r) => {
        const count = counts[r.type] ?? 0;
        const isSelected = userReaction === r.type;
        return (
          <button
            key={r.type}
            type="button"
            onClick={() => onSelect(r.type)}
            disabled={isLoading}
            className={`
              inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-sm font-medium
              transition-all duration-200 active:scale-[0.97] hover:scale-105
              ${isSelected
                ? 'bg-[#7C3AED] text-white shadow-sm ring-1 ring-[#7C3AED]/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-800'
              }
            `}
          >
            <span className="text-base">{r.emoji}</span>
            <span className="tabular-nums">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function getItemLabel(categorySlug?: string | null): string {
  if (!categorySlug) return 'آیتم';
  const s = categorySlug.toLowerCase();
  if (s.includes('movie') || s.includes('film') || s.includes('series') || s.includes('سریال')) return 'فیلم';
  if (s.includes('book')) return 'کتاب';
  if (s.includes('restaurant') || s.includes('cafe') || s.includes('رستوران')) return 'جایی';
  if (s.includes('travel') || s.includes('سفر')) return 'مقصدی';
  return 'آیتم';
}

function CommentMoreMenu({ onReport }: { onReport: () => void }) {
  const [open, setOpen] = useState(false);

  const handleReport = () => {
    setOpen(false);
    onReport();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="گزینه‌های بیشتر"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="گزینه‌های نظر">
        <button
          type="button"
          onClick={handleReport}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-right"
        >
          <Flag className="w-4 h-4 flex-shrink-0" />
          گزارش نظر
        </button>
      </BottomSheet>
    </>
  );
}

function VibeCommentItem({
  comment,
  isOwner,
  onApprove,
  onReject,
  onVote,
  onReport,
}: {
  comment: Comment;
  isOwner: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onVote: (id: string, value: 1 | -1) => void;
  onReport: (id: string) => void;
}) {
  const [localUp, setLocalUp] = useState(comment.helpfulUp ?? 0);
  const [localDown, setLocalDown] = useState(comment.helpfulDown ?? 0);
  const [localVote, setLocalVote] = useState<number | null>(comment.userVote ?? null);
  const [expanded, setExpanded] = useState(false);

  const showReadMore = comment.content.length > COMMENT_CLAMP_CHAR_THRESHOLD;

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

  const isSuggestion = comment.type === 'suggestion';
  const isPending = comment.suggestionStatus === 'pending';
  const isApproved = comment.suggestionStatus === 'approved';

  const profileUrl = comment.users.username ? `/u/${encodeURIComponent(comment.users.username)}` : null;

  return (
    <div
      id={`comment-${comment.id}`}
      className="flex gap-3 rounded-xl border border-wibe bg-wibe-card px-3 py-3.5 shadow-sm"
    >
      <div className="flex-shrink-0">
        {profileUrl ? (
          <Link href={profileUrl} className="block">
            <CommentAvatar
              src={comment.users.image}
              name={comment.users.name}
              email={comment.users.email}
              size={40}
              avatarType={comment.users.avatarType ?? undefined}
              avatarId={comment.users.avatarId ?? null}
              avatarStatus={comment.users.avatarStatus ?? null}
            />
          </Link>
        ) : (
          <CommentAvatar
            src={comment.users.image}
            name={comment.users.name}
            email={comment.users.email}
            size={40}
            avatarType={comment.users.avatarType ?? undefined}
            avatarId={comment.users.avatarId ?? null}
            avatarStatus={comment.users.avatarStatus ?? null}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            {profileUrl ? (
              <Link href={profileUrl} className="font-medium text-gray-900 text-sm hover:text-primary transition-colors">
                {comment.users.name || comment.users.email?.split('@')[0] || 'کاربر'}
              </Link>
            ) : (
              <span className="font-medium text-gray-900 text-sm">
                {comment.users.name || comment.users.email?.split('@')[0] || 'کاربر'}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: faIR })}
            </span>
            {comment.users.curatorLevel && (
              <CuratorBadge level={comment.users.curatorLevel} size="small" glow={false} />
            )}
            {isSuggestion && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">➕ پیشنهاد</span>
            )}
          </div>
          <CommentMoreMenu onReport={() => onReport(comment.id)} />
        </div>
        <div className="relative">
          <p
            className={`text-gray-700 text-sm leading-relaxed break-words whitespace-pre-wrap ${
              !expanded && showReadMore ? 'line-clamp-3' : ''
            }`}
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
        {isApproved && (
          <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5 font-medium">
            <span>✔</span> به لیست اضافه شد
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleVote(1)}
              aria-label={`مفید بود${localUp > 0 ? `، ${localUp} رأی` : ''}`}
              className={`flex items-center gap-1 text-xs transition-colors ${localVote === 1 ? 'text-green-600 font-medium' : 'text-gray-500 hover:text-green-600'}`}
              title="مفید بود"
            >
              <ThumbsUp className={`w-4 h-4 ${localVote === 1 ? 'fill-current' : ''}`} />
              {localUp > 0 && <span className="tabular-nums">{localUp.toLocaleString('fa-IR')}</span>}
            </button>
            <button
              type="button"
              onClick={() => handleVote(-1)}
              aria-label={`مفید نبود${localDown > 0 ? `، ${localDown} رأی` : ''}`}
              className={`flex items-center gap-1 text-xs transition-colors ${localVote === -1 ? 'text-amber-600 font-medium' : 'text-gray-400 hover:text-amber-600'}`}
              title="مفید نبود"
            >
              <ThumbsDown className={`w-4 h-4 ${localVote === -1 ? 'fill-current' : ''}`} />
              {localDown > 0 && <span className="tabular-nums">{localDown.toLocaleString('fa-IR')}</span>}
            </button>
          </div>
        </div>
        {isSuggestion && isOwner && isPending && (
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => onApprove(comment.id)}
              className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200"
            >
              تایید
            </button>
            <button
              type="button"
              onClick={() => onReject(comment.id)}
              className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200"
            >
              رد
            </button>
          </div>
        )}
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pr-4 border-r-2 border-gray-100 space-y-2">
            {comment.replies.map((reply) => {
              const replyProfileUrl = reply.users.username ? `/u/${encodeURIComponent(reply.users.username)}` : null;
              return (
              <div key={reply.id} className="flex gap-2">
                {replyProfileUrl ? (
                  <Link href={replyProfileUrl} className="block flex-shrink-0">
                    <CommentAvatar
                      src={reply.users.image}
                      name={reply.users.name}
                      email={reply.users.email}
                      size={28}
                      avatarType={reply.users.avatarType ?? undefined}
                      avatarId={reply.users.avatarId ?? null}
                      avatarStatus={reply.users.avatarStatus ?? null}
                    />
                  </Link>
                ) : (
                  <CommentAvatar
                    src={reply.users.image}
                    name={reply.users.name}
                    email={reply.users.email}
                    size={28}
                    avatarType={reply.users.avatarType ?? undefined}
                    avatarId={reply.users.avatarId ?? null}
                    avatarStatus={reply.users.avatarStatus ?? null}
                  />
                )}
                <div>
                  {replyProfileUrl ? (
                    <Link href={replyProfileUrl} className="font-medium text-gray-800 text-xs hover:text-primary">
                      {reply.users.name || reply.users.email?.split('@')[0]}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-800 text-xs">
                      {reply.users.name || reply.users.email?.split('@')[0]}
                    </span>
                  )}
                  {reply.users.curatorLevel && (
                    <span className="mr-1.5 inline-flex align-middle">
                      <CuratorBadge level={reply.users.curatorLevel} size="small" glow={false} />
                    </span>
                  )}
                  <span className="text-gray-600 text-xs mr-1">—</span>
                  <span className="text-gray-600 text-xs">{reply.content}</span>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getPlaceholders(categorySlug?: string | null) {
  return {
    collapsed: 'نظرت درباره این لیست چیه؟ پیشنهادی داری؟',
    comment: 'نظرت درباره این لیست چیه؟ پیشنهادی داری؟',
    suggestion: 'اسم آیتم پیشنهادی‌تو بنویس...',
  };
}

function VibeCommentInput({
  isExpanded,
  onExpand,
  onSubmit,
  isSuggestionMode,
  isLoading,
  categorySlug,
  userImage,
  userName,
  userEmail,
  maxCommentLength,
  suggestionMaxLength,
}: {
  isExpanded: boolean;
  onExpand: () => void;
  onSubmit: (content: string, type: 'comment' | 'suggestion') => Promise<boolean> | boolean;
  isSuggestionMode: boolean;
  isLoading: boolean;
  categorySlug?: string | null;
  userImage?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  maxCommentLength: number;
  suggestionMaxLength: number;
}) {
  const [content, setContent] = useState('');
  const placeholders = getPlaceholders(categorySlug);
  const maxLength = isSuggestionMode ? suggestionMaxLength : maxCommentLength;
  const trimmedLength = content.trim().length;
  const warnThreshold = Math.floor(maxLength * 0.8);
  const isNearLimit = content.length >= warnThreshold;
  const isOverLimit = content.length > maxLength;
  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_COMMENT_LENGTH;
  const canSubmit = trimmedLength >= MIN_COMMENT_LENGTH && !isOverLimit && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!canSubmit) return;
    const ok = await onSubmit(text, isSuggestionMode ? 'suggestion' : 'comment');
    if (ok) setContent('');
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="w-full h-[52px] flex items-center gap-3 px-4 rounded-2xl border border-gray-200 bg-white shadow-sm text-gray-500 text-sm text-right hover:border-[#7C3AED]/40 hover:bg-gray-50/50 transition-all focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
      >
        <CommentAvatar src={userImage ?? null} name={userName ?? null} email={userEmail ?? null} size={36} />
        <span className="flex-1 text-right">{placeholders.collapsed}</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-end gap-3 p-3 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CommentAvatar src={userImage ?? null} name={userName ?? null} email={userEmail ?? null} size={36} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          placeholder={isSuggestionMode ? placeholders.suggestion : placeholders.comment}
          className="flex-1 min-h-[44px] py-2.5 px-0 border-0 bg-transparent text-sm resize-none focus:outline-none"
          rows={2}
          maxLength={maxLength}
          aria-describedby="comment-char-count"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-[#7C3AED] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setContent('')}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
          >
            انصراف
          </button>
          {isTooShort && (
            <span className="text-xs text-amber-600">حداقل {MIN_COMMENT_LENGTH.toLocaleString('fa-IR')} کاراکتر</span>
          )}
        </div>
        <span
          id="comment-char-count"
          className={`text-xs tabular-nums ${
            isOverLimit ? 'text-red-500 font-medium' : isNearLimit ? 'text-amber-600' : 'text-gray-400'
          }`}
        >
          {content.length.toLocaleString('fa-IR')}/{maxLength.toLocaleString('fa-IR')}
        </span>
      </div>
    </form>
  );
}

export default function VibeCommentSection({ listId, isOwner, categorySlug, onOpenSuggestItem }: VibeCommentSectionProps) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isSuggestionMode, setIsSuggestionMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'helpful' | 'newest'>('helpful');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const sortParam = sortBy === 'helpful' ? 'popular' : 'newest';

  const { data: commentsData, isLoading, refetch: refetchComments } = useQuery({
    queryKey: ['lists', listId, 'vibe-comments', sortParam],
    queryFn: () => fetchVibeComments(listId, sortParam),
    enabled: !!listId,
  });
  const comments = commentsData?.comments ?? [];
  const commentsEnabled = commentsData?.commentsEnabled ?? true;
  const maxCommentLength = commentsData?.maxCommentLength ?? DEFAULT_LIST_COMMENT_MAX_LENGTH;
  const suggestionMaxLength = commentsData?.suggestionMaxLength ?? DEFAULT_SUGGESTION_MAX_LENGTH;

  const { data: reactionsData } = useQuery({
    queryKey: ['lists', listId, 'reactions'],
    queryFn: () => fetchReactions(listId),
    enabled: !!listId,
  });
  const counts = reactionsData?.counts ?? { love: 0, cry: 0, night: 0, meh: 0, suggestion: 0 };
  const userReaction = reactionsData?.userReaction ?? null;

  const [reactionsLoading, setReactionsLoading] = useState(false);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [listId, sortBy]);

  const handleReaction = async (type: string) => {
    if (status !== 'authenticated') return;
    setReactionsLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type }),
      });
      const data = await res.json();
      if (data.success) {
        queryClient.setQueryData<ReactionsResponse>(['lists', listId, 'reactions'], {
          counts: data.data.counts,
          userReaction: data.data.userReaction,
        });
      }
    } finally {
      setReactionsLoading(false);
    }
  };

  const handleSuggestionClick = () => {
    if (onOpenSuggestItem) {
      onOpenSuggestItem();
    } else {
      setIsSuggestionMode(true);
      setIsFormExpanded(true);
    }
  };

  const handleSubmit = async (content: string, type: 'comment' | 'suggestion'): Promise<boolean> => {
    if (status !== 'authenticated') return false;
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type }),
      });
      const data = await res.json();
      if (data.success) {
        refetchComments();
        setIsFormExpanded(false);
        setIsSuggestionMode(false);
        setToast({ message: data.message || 'نظرت به لیست اضافه شد ✨', type: 'success' });
        return true;
      }
      setToast({
        message: data.error || (res.status === 429 ? 'کمی صبر کن و دوباره امتحان کن 🙂' : 'ارسال نشد'),
        type: 'error',
      });
      return false;
    } catch {
      setToast({ message: 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
      return false;
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      const res = await fetch(`/api/lists/comments/${commentId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        refetchComments();
        setToast({ message: 'پیشنهادت به لیست اضافه شد 🎉', type: 'success' });
      } else {
        setToast({ message: data.error || 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
      }
    } catch {
      setToast({ message: 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
    }
  };

  const handleReject = async (commentId: string) => {
    try {
      const res = await fetch(`/api/lists/comments/${commentId}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        refetchComments();
        setToast({ message: 'پیشنهاد رد شد', type: 'success' });
      }
    } catch {
      setToast({ message: 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
    }
  };

  const handleVote = async (commentId: string, value: 1 | -1) => {
    try {
      await fetch(`/api/lists/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      refetchComments();
    } catch {
      refetchComments();
    }
  };

  const handleReport = async (commentId: string) => {
    if (status !== 'authenticated') {
      setToast({ message: 'برای گزارش نظر وارد شو', type: 'error' });
      return;
    }
    try {
      const res = await fetch(`/api/lists/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'محتوا نامناسب' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setToast({
          message: data.message || 'ممنون که اطلاع دادی 🙏 بررسیش می‌کنیم',
          type: 'success',
        });
      } else {
        setToast({
          message:
            data.error ||
            (res.status === 401 ? 'برای گزارش نظر وارد شو' : 'چند لحظه بعد دوباره امتحان کن ✨'),
          type: 'error',
        });
      }
    } catch {
      setToast({ message: 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
    }
  };

  const displayedComments = comments.slice(0, visibleCount);
  const hasMore = visibleCount < comments.length;
  const remainingCount = comments.length - visibleCount;
  const loadMoreStep = Math.min(COMMENTS_LOAD_MORE_STEP, remainingCount);
  const commentCount = comments.filter((c) => c.type === 'comment').length;
  const suggestionCount = comments.filter((c) => c.type === 'suggestion').length;

  const hasComments = comments.length > 0;

  return (
    <section className="mt-8 pt-6 border-t border-wibe">
      <h2 className="wibe-h3 text-foreground mb-0.5">گفتگو درباره این لیست</h2>
      <p className="wibe-caption text-wibe-secondary mb-3">
        {commentCount.toLocaleString('fa-IR')} نظر · {suggestionCount.toLocaleString('fa-IR')} پیشنهاد
      </p>

      {/* Spacing: Header→Reaction 12, Reaction→Input 12, Input→Suggest 16, Suggest→Empty 20 */}
      <div className="space-y-3">
        {/* Inline Reaction Pills — فقط وقتی گفتگو شروع شده */}
        {status === 'authenticated' && hasComments && (
          <div>
            <ReactionPills
              counts={counts}
              userReaction={userReaction}
              onSelect={handleReaction}
              isLoading={reactionsLoading}
            />
          </div>
        )}

        {/* Comment Input — Primary */}
        {commentsEnabled && status === 'authenticated' && (
          <div>
            <VibeCommentInput
              isExpanded={isFormExpanded}
              onExpand={() => setIsFormExpanded(true)}
              onSubmit={handleSubmit}
              isSuggestionMode={isSuggestionMode}
              isLoading={submitLoading}
              categorySlug={categorySlug}
              userImage={session?.user?.image}
              userName={session?.user?.name}
              userEmail={session?.user?.email}
              maxCommentLength={maxCommentLength}
              suggestionMaxLength={suggestionMaxLength}
            />
          </div>
        )}

        {/* Suggest Item — فقط بعد از اولین کامنت، Secondary CTA — Input→Suggest 16px */}
        {status === 'authenticated' && onOpenSuggestItem && hasComments && (
          <button
            type="button"
            onClick={handleSuggestionClick}
            className="w-full flex items-center gap-3 py-2 px-3 mt-1 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 hover:bg-[#7C3AED]/8 transition-colors text-right"
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#7C3AED]/15 flex items-center justify-center text-[#7C3AED] text-xs font-bold">
              +
            </span>
            <span className="text-sm font-medium text-gray-700">پیشنهاد آیتم جدید</span>
          </button>
        )}

        {!commentsEnabled && (
          <p className="text-sm text-gray-500 py-4">کامنت‌ها برای این لیست غیرفعال است</p>
        )}

        {status === 'unauthenticated' && (
          <p className="text-sm text-gray-500 py-4">برای ثبت نظر وارد شو</p>
        )}

        {/* Sort + Comments */}
        {!isLoading && comments.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex gap-2 mb-4">
              <span className="text-xs text-gray-500 py-1.5">مرتب‌سازی:</span>
              <button
                type="button"
                onClick={() => setSortBy('helpful')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sortBy === 'helpful' ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                مفیدترین
              </button>
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sortBy === 'newest' ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                جدیدترین
              </button>
            </div>
          </div>
        )}

        {/* Comments List / Empty State — Suggest→Empty 20px */}
        <div className={hasComments ? 'mt-2' : 'mt-1'}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-4 text-center wibe-caption text-wibe-secondary">
            هنوز گفتگویی نیست —{' '}
            {status === 'authenticated' && commentsEnabled ? (
              <button
                type="button"
                onClick={() => setIsFormExpanded(true)}
                className="font-medium text-primary hover:underline"
              >
                اولین نظر رو بذار
              </button>
            ) : (
              'اولین نظر رو بذار'
            )}
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {displayedComments.map((c) => (
                <VibeCommentItem
                  key={c.id}
                  comment={c}
                  isOwner={isOwner}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onVote={handleVote}
                  onReport={handleReport}
                />
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + COMMENTS_LOAD_MORE_STEP)}
                className="w-full py-3 mt-4 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <ChevronDown className="w-4 h-4" />
                {loadMoreStep.toLocaleString('fa-IR')} نظر دیگر ({remainingCount.toLocaleString('fa-IR')} باقی‌مانده)
              </button>
            )}
          </>
        )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
