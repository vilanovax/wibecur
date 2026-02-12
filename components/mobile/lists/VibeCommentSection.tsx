'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Loader2, ChevronDown, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Image from 'next/image';
import Toast from '@/components/shared/Toast';

const REACTIONS = [
  { type: 'love', label: 'عاشقانه', emoji: '💕' },
  { type: 'cry', label: 'احساسی', emoji: '😭' },
  { type: 'night', label: 'مناسب شب', emoji: '🌙' },
  { type: 'meh', label: 'معمولی', emoji: '😐' },
  { type: 'suggestion', label: 'پیشنهاد', emoji: '➕' },
] as const;

const INITIAL_VISIBLE = 5;

interface CommentUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
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
  listUserId: string;
  categorySlug?: string | null;
  /** وقتی کاربر روی «پیشنهاد» کلیک می‌کند، این فراخوانی می‌شود (مثلاً برای باز کردن مودال جستجو-محور) */
  onOpenSuggestItem?: () => void;
}

function ReactionChips({
  counts,
  userReaction,
  onSelect,
  onSuggestionSelect,
  isLoading,
}: {
  counts: Record<string, number>;
  userReaction: string | null;
  onSelect: (type: string) => void;
  onSuggestionSelect: () => void;
  isLoading: boolean;
}) {
  const totalReactions = REACTIONS.filter((r) => r.type !== 'suggestion').reduce(
    (sum, r) => sum + (counts[r.type] ?? 0),
    0
  );
  const allZero = totalReactions === 0;

  return (
    <div className="flex flex-wrap gap-3">
      {REACTIONS.map((r) => {
        const count = counts[r.type] ?? 0;
        const isSelected = userReaction === r.type;
        const isZero = count === 0 && r.type !== 'suggestion';
        const handleClick = () => {
          if (r.type === 'suggestion') onSuggestionSelect();
          else onSelect(r.type);
        };
        return (
          <button
            key={r.type}
            type="button"
            onClick={handleClick}
            disabled={isLoading}
            className={`
              inline-flex flex-col items-center gap-1 px-4 py-3 rounded-xl text-sm font-medium
              transition-all duration-200 min-w-[58px] active:scale-[0.98]
              ${isSelected
                ? 'bg-primary text-white shadow-lg ring-2 ring-primary/30'
                : r.type === 'suggestion'
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                  : allZero && isZero
                    ? 'bg-gray-50 text-gray-400 opacity-70 hover:opacity-100 hover:bg-gray-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }
            `}
          >
            <span className="text-lg">{r.emoji}</span>
            <span className="text-[10px] text-current/90">{r.label}</span>
            {r.type !== 'suggestion' && <span className="text-xs font-semibold">{count}</span>}
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

function VibeCommentItem({
  comment,
  isOwner,
  listUserId,
  isFirst,
  onApprove,
  onReject,
  onVote,
  onReport,
}: {
  comment: Comment;
  isOwner: boolean;
  listUserId: string;
  isFirst: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onVote: (id: string, value: 1 | -1) => void;
  onReport: (id: string) => void;
}) {
  const [localUp, setLocalUp] = useState(comment.helpfulUp ?? 0);
  const [localDown, setLocalDown] = useState(comment.helpfulDown ?? 0);
  const [localVote, setLocalVote] = useState<number | null>(comment.userVote ?? null);

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

  const isListOwner = comment.users.id === listUserId;

  return (
    <div
      id={`comment-${comment.id}`}
      className={`flex gap-3 py-5 transition-all ${
        isFirst
          ? 'pt-5 bg-amber-50/40 rounded-xl px-4 -mx-1 border border-amber-100/60'
          : ''
      }`}
    >
      <div className="flex-shrink-0">
        {comment.users.image ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={comment.users.image}
              alt={comment.users.name || ''}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-sm">
              {(comment.users.name || comment.users.email || '?').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`font-medium text-gray-900 text-sm ${isFirst ? 'font-semibold' : ''}`}>
            {comment.users.name || comment.users.email?.split('@')[0] || 'کاربر'}
          </span>
          {isListOwner && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
              👑 صاحب لیست
            </span>
          )}
          {isSuggestion && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">➕ پیشنهاد</span>
          )}
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
        {isApproved && (
          <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5 font-medium">
            <span>✔</span> به لیست اضافه شد
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: faIR })}
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleVote(1)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${localVote === 1 ? 'text-green-600 font-medium' : 'text-gray-500 hover:text-green-600'}`}
              title="مفید بود"
            >
              <ThumbsUp className={`w-4 h-4 ${localVote === 1 ? 'fill-current' : ''}`} />
              <span>مفید بود ({localUp})</span>
            </button>
            <button
              type="button"
              onClick={() => handleVote(-1)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${localVote === -1 ? 'text-amber-600 font-medium' : 'text-gray-400 hover:text-amber-600'}`}
              title="مفید نبود"
            >
              <ThumbsDown className={`w-4 h-4 ${localVote === -1 ? 'fill-current' : ''}`} />
              <span>مفید نبود ({localDown})</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => onReport(comment.id)}
            className="text-xs text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1"
          >
            <Flag className="w-3.5 h-3.5" />
            گزارش
          </button>
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
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {(reply.users.name || reply.users.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium text-gray-800 text-xs">
                    {reply.users.name || reply.users.email?.split('@')[0]}
                  </span>
                  <span className="text-gray-600 text-xs mr-1">—</span>
                  <span className="text-gray-600 text-xs">{reply.content}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getPlaceholders(categorySlug?: string | null) {
  const itemLabel = getItemLabel(categorySlug);
  const itemWithY = itemLabel.endsWith('ی') ? itemLabel : `${itemLabel}ی`;
  return {
    collapsed: `نظرت درباره این لیست چیه؟ یا ${itemWithY} جا مونده؟`,
    comment: 'نظرت درباره این لیست چیه؟',
    suggestion: `اسم ${itemLabel} پیشنهادی‌تو بنویس...`,
  };
}

function VibeCommentInput({
  isExpanded,
  onExpand,
  onSubmit,
  isSuggestionMode,
  isLoading,
  categorySlug,
}: {
  isExpanded: boolean;
  onExpand: () => void;
  onSubmit: (content: string, type: 'comment' | 'suggestion') => void;
  isSuggestionMode: boolean;
  isLoading: boolean;
  categorySlug?: string | null;
}) {
  const [content, setContent] = useState('');
  const placeholders = getPlaceholders(categorySlug);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || isLoading) return;
    onSubmit(text, isSuggestionMode ? 'suggestion' : 'comment');
    setContent('');
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="w-full py-4 px-5 rounded-xl border-2 border-gray-200 bg-gray-50/80 text-gray-600 text-sm text-right hover:border-primary/50 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        {placeholders.collapsed}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isSuggestionMode ? placeholders.suggestion : placeholders.comment}
        className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
        rows={3}
        maxLength={500}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setContent('')}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? 'در حال ارسال...' : 'ارسال'}
        </button>
      </div>
    </form>
  );
}

export default function VibeCommentSection({ listId, isOwner, listUserId, categorySlug, onOpenSuggestItem }: VibeCommentSectionProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    love: 0,
    cry: 0,
    night: 0,
    meh: 0,
    suggestion: 0,
  });
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reactionsLoading, setReactionsLoading] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isSuggestionMode, setIsSuggestionMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'helpful' | 'newest'>('helpful');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const sortParam = sortBy === 'helpful' ? 'popular' : 'newest';
      const res = await fetch(`/api/lists/${listId}/comments?sort=${sortParam}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
        setCommentsEnabled(data.commentsEnabled ?? true);
        setVisibleCount(INITIAL_VISIBLE);
      }
    } catch {
      setToast({ message: 'مشکلی پیش اومد، دوباره امتحان کن ✨', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReactions = async () => {
    try {
      const res = await fetch(`/api/lists/${listId}/reactions`);
      const data = await res.json();
      if (data.success) {
        setCounts(data.data.counts);
        setUserReaction(data.data.userReaction);
      }
    } catch {
      // Silent
    }
  };

  useEffect(() => {
    fetchComments();
    fetchReactions();
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
        setCounts(data.data.counts);
        setUserReaction(data.data.userReaction);
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

  const handleSubmit = async (content: string, type: 'comment' | 'suggestion') => {
    if (status !== 'authenticated') return;
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type }),
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
        setIsFormExpanded(false);
        setIsSuggestionMode(false);
        setToast({ message: data.message || 'نظرت به لیست اضافه شد ✨', type: 'success' });
      } else {
        setToast({ message: data.error || 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
      }
    } catch {
      setToast({ message: 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      const res = await fetch(`/api/lists/comments/${commentId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchComments();
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
        fetchComments();
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
      fetchComments();
    } catch {
      fetchComments();
    }
  };

  const handleReport = async (commentId: string) => {
    if (!confirm('آیا می‌خواهید این نظر را گزارش دهید؟')) return;
    try {
      const res = await fetch(`/api/lists/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'محتوا نامناسب' }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message || 'ممنون که اطلاع دادی 🙏 بررسیش می‌کنیم', type: 'success' });
      } else {
        setToast({ message: data.error || 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
      }
    } catch {
      setToast({ message: 'چند لحظه بعد دوباره امتحان کن ✨', type: 'error' });
    }
  };

  const displayedComments = comments.slice(0, visibleCount);
  const hasMore = comments.length > INITIAL_VISIBLE && visibleCount < comments.length;

  return (
    <section className="mt-16 pt-10 border-t border-gray-200">
      <h2 className="text-[1.125rem] font-semibold text-gray-800 mb-1">
        💬 نظرات و پیشنهادها ({comments.length})
      </h2>
      <p className="text-sm text-gray-500 mb-6">این لیست حالتو عوض کرد؟</p>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        {/* Reaction Row — مرکز توجه اول */}
        {status === 'authenticated' && (
          <div className="mb-5">
            <ReactionChips
              counts={counts}
              userReaction={userReaction}
              onSelect={handleReaction}
              onSuggestionSelect={handleSuggestionClick}
              isLoading={reactionsLoading}
            />
          </div>
        )}

        {/* Input — وزن بصری بالا */}
        {commentsEnabled && status === 'authenticated' && (
          <div className="mb-8 mt-1">
            <VibeCommentInput
              isExpanded={isFormExpanded}
              onExpand={() => setIsFormExpanded(true)}
              onSubmit={handleSubmit}
              isSuggestionMode={isSuggestionMode}
              isLoading={submitLoading}
              categorySlug={categorySlug}
            />
          </div>
        )}

        {!commentsEnabled && (
          <p className="text-sm text-gray-500 py-4">کامنت‌ها برای این لیست غیرفعال است</p>
        )}

        {status === 'unauthenticated' && (
          <p className="text-sm text-gray-500 py-4">برای ثبت نظر وارد شو ✨</p>
        )}

        {/* Soft divider + Sort */}
        {!isLoading && comments.length > 0 && (
          <div className="border-t border-gray-100 pt-5 mt-2">
            <div className="flex gap-2 mb-4">
            <span className="text-xs text-gray-500 py-1.5">مرتب‌سازی:</span>
            <button
              type="button"
              onClick={() => setSortBy('helpful')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sortBy === 'helpful' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              مفیدترین
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sortBy === 'newest' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              جدیدترین
            </button>
            </div>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4">
            <MessageSquare className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-700 font-medium text-base">هنوز نظری ثبت نشده</p>
            <p className="text-sm text-gray-500 mt-1.5">اولین نفری باش که چیزی می‌نویسه ✨</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayedComments.map((c, idx) => (
                <VibeCommentItem
                  key={c.id}
                  comment={c}
                  isOwner={isOwner}
                  listUserId={listUserId}
                  isFirst={idx === 0}
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
                onClick={() => setVisibleCount((v) => v + INITIAL_VISIBLE)}
                className="w-full py-3 mt-4 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <ChevronDown className="w-4 h-4" />
                مشاهده همه نظرات ({comments.length})
              </button>
            )}
          </>
        )}
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
