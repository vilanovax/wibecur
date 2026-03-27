'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Loader2, ChevronDown, ThumbsUp, ThumbsDown, Flag, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Toast from '@/components/shared/Toast';
import CuratorBadge from '@/components/shared/CuratorBadge';
import CommentAvatar from '@/components/shared/CommentAvatar';

const DEFAULT_INITIAL = 3;
const DEFAULT_LOAD_MORE = 10;

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
  listUserId: string;
  categorySlug?: string | null;
  /** وقتی کاربر روی «پیشنهاد» کلیک می‌کند، این فراخوانی می‌شود (مثلاً برای باز کردن مودال جستجو-محور) */
  onOpenSuggestItem?: () => void;
}

interface VibeCommentsResponse {
  comments: Comment[];
  commentsEnabled: boolean;
  initialDisplayCount: number;
  loadMoreCount: number;
}

async function fetchVibeComments(listId: string, sortParam: string): Promise<VibeCommentsResponse> {
  const res = await fetch(`/api/lists/${listId}/comments?sort=${sortParam}`);
  const data = await res.json();
  if (!data.success) return { comments: [], commentsEnabled: true, initialDisplayCount: 3, loadMoreCount: 10 };
  return {
    comments: data.data ?? [],
    commentsEnabled: data.commentsEnabled ?? true,
    initialDisplayCount: data.initialDisplayCount ?? 3,
    loadMoreCount: data.loadMoreCount ?? 10,
  };
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
  const profileUrl = comment.users.username ? `/u/${encodeURIComponent(comment.users.username)}` : null;

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
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          {profileUrl ? (
            <Link href={profileUrl} className={`font-medium text-gray-900 text-sm hover:text-primary transition-colors ${isFirst ? 'font-semibold' : ''}`}>
              {comment.users.name || comment.users.email?.split('@')[0] || 'کاربر'}
            </Link>
          ) : (
            <span className={`font-medium text-gray-900 text-sm ${isFirst ? 'font-semibold' : ''}`}>
              {comment.users.name || comment.users.email?.split('@')[0] || 'کاربر'}
            </span>
          )}
          {comment.users.curatorLevel && (
            <CuratorBadge level={comment.users.curatorLevel} size="small" glow={false} />
          )}
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
}: {
  isExpanded: boolean;
  onExpand: () => void;
  onSubmit: (content: string, type: 'comment' | 'suggestion') => void;
  isSuggestionMode: boolean;
  isLoading: boolean;
  categorySlug?: string | null;
  userImage?: string | null;
  userName?: string | null;
  userEmail?: string | null;
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
          onChange={(e) => setContent(e.target.value)}
          placeholder={isSuggestionMode ? placeholders.suggestion : placeholders.comment}
          className="flex-1 min-h-[44px] py-2.5 px-0 border-0 bg-transparent text-sm resize-none focus:outline-none"
          rows={2}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-[#7C3AED] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setContent('')}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}

export default function VibeCommentSection({ listId, isOwner, listUserId, categorySlug, onOpenSuggestItem }: VibeCommentSectionProps) {
  const { data: session, status } = useSession();
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isSuggestionMode, setIsSuggestionMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'helpful' | 'newest'>('helpful');
  const [visibleCount, setVisibleCount] = useState(DEFAULT_INITIAL);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const sortParam = sortBy === 'helpful' ? 'popular' : 'newest';

  const { data: commentsData, isLoading, refetch: refetchComments } = useQuery({
    queryKey: ['lists', listId, 'vibe-comments', sortParam],
    queryFn: () => fetchVibeComments(listId, sortParam),
    enabled: !!listId,
  });
  const comments = commentsData?.comments ?? [];
  const commentsEnabled = commentsData?.commentsEnabled ?? true;
  const initialCount = commentsData?.initialDisplayCount ?? DEFAULT_INITIAL;
  const loadMoreCount = commentsData?.loadMoreCount ?? DEFAULT_LOAD_MORE;

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [listId, sortBy, initialCount]);

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
        refetchComments();
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
  const hasMore = visibleCount < comments.length;
  const commentCount = comments.filter((c) => c.type === 'comment').length;
  const suggestionCount = comments.filter((c) => c.type === 'suggestion').length;

  const hasComments = comments.length > 0;

  return (
    <section className="mt-12 pt-6 border-t border-gray-200">
      {/* Suggest Item — بالای بخش گفتگو */}
      {status === 'authenticated' && onOpenSuggestItem && (
        <button
          type="button"
          onClick={handleSuggestionClick}
          className="w-full flex items-center gap-3 py-2 px-3 mb-6 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 hover:bg-[#7C3AED]/8 transition-colors text-right"
        >
          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#7C3AED]/15 flex items-center justify-center text-[#7C3AED] text-xs font-bold">
            +
          </span>
          <span className="text-sm font-medium text-gray-700">پیشنهاد آیتم جدید</span>
        </button>
      )}

      {/* Engagement Header */}
      <h2 className="text-lg font-bold text-gray-900 mb-1">
        💬 گفتگو درباره این لیست
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        {commentCount} نظر · {suggestionCount} پیشنهاد
      </p>

      <div className="space-y-3">
        {/* Comment Input */}
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
            />
          </div>
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
          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-gray-50/80 border border-gray-100">
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold">هنوز گفتگویی شروع نشده</p>
            <p className="text-sm text-gray-500 mt-0.5">اولین نفری باش که نظر می‌ده</p>
            {status === 'authenticated' && commentsEnabled && (
              <button
                type="button"
                onClick={() => setIsFormExpanded(true)}
                className="mt-4 h-[44px] px-6 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6]/90 text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                شروع گفتگو
              </button>
            )}
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
                onClick={() => setVisibleCount((v) => v + loadMoreCount)}
                className="w-full py-3 mt-4 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <ChevronDown className="w-4 h-4" />
                مشاهده همه نظرات ({comments.length})
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
