'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { MessageSquare, Loader2, ChevronDown, ThumbsUp, ThumbsDown, Flag, Send, MoreVertical } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import Toast from '@/components/shared/Toast';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import CommentReportModal from '@/components/mobile/comments/CommentReportModal';
import CuratorBadge from '@/components/shared/CuratorBadge';
import CommentAvatar from '@/components/shared/CommentAvatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { track } from '@/lib/analytics';
import {
  COMMENT_CLAMP_CHAR_THRESHOLD,
  COMMENTS_INITIAL_VISIBLE,
  COMMENTS_LOAD_MORE_STEP,
  DEFAULT_LIST_COMMENT_MAX_LENGTH,
  DEFAULT_SUGGESTION_MAX_LENGTH,
  MIN_COMMENT_LENGTH,
} from '@/lib/comment-limits';

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
  /** داخل ستون sticky دسکتاپ — بدون border بالایی اضافه */
  embeddedInSidebar?: boolean;
  listId: string;
  listSlug?: string;
  isOwner: boolean;
  categorySlug?: string | null;
  /** وقتی کاربر روی «پیشنهاد» کلیک می‌کند، این فراخوانی می‌شود (مثلاً برای باز کردن مودال جستجو-محور) */
  onOpenSuggestItem?: () => void;
}

interface VibeCommentsPage {
  comments: Comment[];
  commentsEnabled: boolean;
  maxCommentLength: number;
  suggestionMaxLength: number;
  totalCount?: number;
  nextCursor: string | null;
  hasMore: boolean;
}

interface ReactionsResponse {
  counts: Record<string, number>;
  userReaction: string | null;
}

async function fetchVibeCommentsPage(
  listId: string,
  sortParam: string,
  cursor: string | null
): Promise<VibeCommentsPage> {
  // صفحهٔ اول کوچک (initial) و صفحات بعدی بزرگ‌تر (load-more) — کاهش payload اولیه.
  const limit = cursor ? COMMENTS_LOAD_MORE_STEP : COMMENTS_INITIAL_VISIBLE;
  const params = new URLSearchParams({ sort: sortParam, limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/lists/${listId}/comments?${params.toString()}`);
  const data = await res.json();
  if (!data.success) {
    return {
      comments: [],
      commentsEnabled: true,
      maxCommentLength: DEFAULT_LIST_COMMENT_MAX_LENGTH,
      suggestionMaxLength: DEFAULT_SUGGESTION_MAX_LENGTH,
      nextCursor: null,
      hasMore: false,
    };
  }
  return {
    comments: data.data ?? [],
    commentsEnabled: data.commentsEnabled ?? true,
    maxCommentLength: data.maxCommentLength ?? DEFAULT_LIST_COMMENT_MAX_LENGTH,
    suggestionMaxLength: data.suggestionMaxLength ?? DEFAULT_SUGGESTION_MAX_LENGTH,
    totalCount: data.totalCount,
    nextCursor: data.nextCursor ?? null,
    hasMore: !!data.hasMore,
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
            className={`inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-brand text-brand-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <span className="text-base">{r.emoji}</span>
            <span>{count.toLocaleString('fa-IR')}</span>
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
        className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        aria-label="گزینه‌های بیشتر"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="گزینه‌های نظر">
        <button
          type="button"
          onClick={handleReport}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-start text-sm text-destructive hover:bg-destructive/10"
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
    <Card
      id={`comment-${comment.id}`}
      className="flex gap-3 bg-popover px-3 py-3.5"
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
              <Link href={profileUrl} className="font-medium text-foreground text-sm hover:text-primary transition-colors">
                {comment.users.name || comment.users.email?.split('@')[0] || 'کاربر'}
              </Link>
            ) : (
              <span className="font-medium text-foreground text-sm">
                {comment.users.name || comment.users.email?.split('@')[0] || 'کاربر'}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.users.curatorLevel && (
              <CuratorBadge level={comment.users.curatorLevel} size="small" glow={false} />
            )}
            {isSuggestion && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">پیشنهاد</span>
            )}
          </div>
          <CommentMoreMenu onReport={() => onReport(comment.id)} />
        </div>
        <div className="relative">
          <p
            className={`text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap ${
              !expanded && showReadMore ? 'line-clamp-3' : ''
            }`}
          >
            {comment.content}
          </p>
          {!expanded && showReadMore && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-popover to-transparent"
              aria-hidden
            />
          )}
        </div>
        {showReadMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 text-xs font-semibold text-brand"
          >
            {expanded ? 'کمتر' : 'بیشتر بخوان'}
          </button>
        )}
        {isApproved && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-success">
            <span>✔</span> به لیست اضافه شد
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleVote(1)}
              aria-label={`مفید بود${localUp > 0 ? `، ${localUp} رأی` : ''}`}
              className={`flex h-11 items-center gap-1 text-xs ${localVote === 1 ? 'font-medium text-success' : 'text-muted-foreground'}`}
              title="مفید بود"
            >
              <ThumbsUp className={`w-4 h-4 ${localVote === 1 ? 'fill-current' : ''}`} />
              {localUp > 0 && <span className="tabular-nums">{localUp.toLocaleString('fa-IR')}</span>}
            </button>
            <button
              type="button"
              onClick={() => handleVote(-1)}
              aria-label={`مفید نبود${localDown > 0 ? `، ${localDown} رأی` : ''}`}
              className={`flex h-11 items-center gap-1 text-xs ${localVote === -1 ? 'font-medium text-warning' : 'text-muted-foreground'}`}
              title="مفید نبود"
            >
              <ThumbsDown className={`w-4 h-4 ${localVote === -1 ? 'fill-current' : ''}`} />
              {localDown > 0 && <span className="tabular-nums">{localDown.toLocaleString('fa-IR')}</span>}
            </button>
          </div>
        </div>
        {isSuggestion && isOwner && isPending && (
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="outline" size="sm" className="h-11 border-success/30 text-success" onClick={() => onApprove(comment.id)}>
              تایید
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-11 border-destructive/30 text-destructive" onClick={() => onReject(comment.id)}>
              رد
            </Button>
          </div>
        )}
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2 border-s-2 border-border ps-4">
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
                    <Link href={replyProfileUrl} className="font-medium text-foreground text-xs hover:text-primary">
                      {reply.users.name || reply.users.email?.split('@')[0]}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground text-xs">
                      {reply.users.name || reply.users.email?.split('@')[0]}
                    </span>
                  )}
                  {reply.users.curatorLevel && (
                    <span className="ms-1.5 inline-flex align-middle">
                      <CuratorBadge level={reply.users.curatorLevel} size="small" glow={false} />
                    </span>
                  )}
                  <span className="ms-1 text-xs text-muted-foreground">—</span>
                  <span className="text-muted-foreground text-xs">{reply.content}</span>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function getPlaceholders(_categorySlug?: string | null) {
  return {
    collapsed: 'نظرت درباره این لیست چیه؟',
    comment: 'نظرت درباره این لیست چیه؟',
    suggestion: 'اسم آیتم پیشنهادی‌تو بنویس…',
  };
}

function VibeCommentInput({
  isExpanded,
  onExpand,
  onSubmit,
  isSuggestionMode,
  isLoading,
  categorySlug,
  maxCommentLength,
  suggestionMaxLength,
}: {
  isExpanded: boolean;
  onExpand: () => void;
  onSubmit: (content: string, type: 'comment' | 'suggestion') => Promise<boolean> | boolean;
  isSuggestionMode: boolean;
  isLoading: boolean;
  categorySlug?: string | null;
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
      <Button
        type="button"
        onClick={onExpand}
        variant="outline"
        size="lg"
        className="w-full justify-start px-4 font-normal text-muted-foreground"
      >
        {placeholders.collapsed}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Card className="flex items-end gap-2 bg-popover p-2.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          placeholder={isSuggestionMode ? placeholders.suggestion : placeholders.comment}
          className="min-h-11 flex-1 resize-none border-0 bg-transparent px-0 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          rows={2}
          maxLength={maxLength}
          aria-describedby="comment-char-count"
        />
        <Button
          type="submit"
          disabled={!canSubmit}
          aria-label="ارسال نظر"
          variant="brand"
          size="icon"
          className="size-11 shrink-0 rounded-full"
        >
          <Send aria-hidden />
        </Button>
      </Card>
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-11" onClick={() => setContent('')}>
            انصراف
          </Button>
          {isTooShort && (
            <span className="text-xs text-warning">حداقل {MIN_COMMENT_LENGTH.toLocaleString('fa-IR')} کاراکتر</span>
          )}
        </div>
        <span
          id="comment-char-count"
          className={`text-xs tabular-nums ${
            isOverLimit ? 'font-medium text-destructive' : isNearLimit ? 'text-warning' : 'text-muted-foreground'
          }`}
        >
          {content.length.toLocaleString('fa-IR')}/{maxLength.toLocaleString('fa-IR')}
        </span>
      </div>
    </form>
  );
}

export default function VibeCommentSection({
  listId,
  listSlug,
  isOwner,
  categorySlug,
  onOpenSuggestItem,
  embeddedInSidebar = false,
}: VibeCommentSectionProps) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isSuggestionMode, setIsSuggestionMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'helpful' | 'newest'>('helpful');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);

  const sortParam = sortBy === 'helpful' ? 'popular' : 'newest';

  const {
    data: commentsData,
    isLoading,
    refetch: refetchComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['lists', listId, 'vibe-comments', sortParam],
    queryFn: ({ pageParam }) =>
      fetchVibeCommentsPage(listId, sortParam, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!listId,
  });
  const comments = commentsData?.pages.flatMap((p) => p.comments) ?? [];
  const firstPage = commentsData?.pages[0];
  const commentsEnabled = firstPage?.commentsEnabled ?? true;
  const maxCommentLength = firstPage?.maxCommentLength ?? DEFAULT_LIST_COMMENT_MAX_LENGTH;
  const suggestionMaxLength = firstPage?.suggestionMaxLength ?? DEFAULT_SUGGESTION_MAX_LENGTH;
  const totalCount = firstPage?.totalCount ?? comments.length;

  const { data: reactionsData } = useQuery({
    queryKey: ['lists', listId, 'reactions'],
    queryFn: () => fetchReactions(listId),
    enabled: !!listId,
  });
  const counts = reactionsData?.counts ?? { love: 0, cry: 0, night: 0, meh: 0, suggestion: 0 };
  const userReaction = reactionsData?.userReaction ?? null;

  const [reactionsLoading, setReactionsLoading] = useState(false);

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
        track('comment_submit', {
          list_id: listId,
          ...(listSlug ? { list_slug: listSlug } : {}),
          ...(categorySlug ? { category_slug: categorySlug } : {}),
          type,
        });
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

  const handleOpenReport = (commentId: string) => {
    if (status !== 'authenticated') {
      setToast({ message: 'برای گزارش نظر وارد شو', type: 'error' });
      return;
    }
    setReportCommentId(commentId);
  };

  const handleReportSuccess = () => {
    setToast({ message: 'ممنون که اطلاع دادی 🙏 بررسیش می‌کنیم', type: 'success' });
  };

  const displayedComments = comments;
  const remainingCount = Math.max(totalCount - comments.length, 0);
  const loadMoreStep = Math.min(COMMENTS_LOAD_MORE_STEP, remainingCount);

  const showSort = !isLoading && totalCount > 1;

  return (
    <section
      className={`border-border ${
        embeddedInSidebar ? 'mt-0 border-t-0 pt-0' : 'mt-8 border-t pt-6'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="wibe-h3 text-foreground">نظرات</h2>
        {showSort ? (
          <div className="flex items-center gap-1" role="group" aria-label="مرتب‌سازی نظرات">
            <button
              type="button"
              onClick={() => setSortBy('helpful')}
              className={`h-11 rounded-full px-3 text-sm font-medium ${
                sortBy === 'helpful'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              مفیدترین
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`h-11 rounded-full px-3 text-sm font-medium ${
                sortBy === 'newest'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              جدیدترین
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {!commentsEnabled && (
          <p className="wibe-small text-muted-foreground">کامنت‌ها برای این لیست غیرفعال است</p>
        )}

        {/* Thread اول — social proof قبل از کامپوزر */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-2 text-center wibe-caption text-muted-foreground">
              هنوز گفتگویی نیست
              {status === 'authenticated' && commentsEnabled ? ' — اولین نظر را پایین بنویس' : null}
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
                    onReport={handleOpenReport}
                  />
                ))}
              </div>
              {hasNextPage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="mt-4 w-full text-brand"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {loadMoreStep.toLocaleString('fa-IR')} نظر دیگر
                      {remainingCount > 0
                        ? ` (${remainingCount.toLocaleString('fa-IR')} باقی‌مانده)`
                        : ''}
                    </>
                  )}
                </Button>
              ) : null}
            </>
          )}
        </div>

        {/* کامپوزر جمع‌وجور پایین thread */}
        {commentsEnabled && status === 'authenticated' ? (
          <div className="space-y-2 border-t border-border pt-3">
            <VibeCommentInput
              isExpanded={isFormExpanded}
              onExpand={() => setIsFormExpanded(true)}
              onSubmit={handleSubmit}
              isSuggestionMode={isSuggestionMode}
              isLoading={submitLoading}
              categorySlug={categorySlug}
              maxCommentLength={maxCommentLength}
              suggestionMaxLength={suggestionMaxLength}
            />
            {onOpenSuggestItem ? (
              <Button type="button" variant="ghost" size="sm" className="h-11 text-brand" onClick={handleSuggestionClick}>
                پیشنهاد آیتم
              </Button>
            ) : null}
          </div>
        ) : null}

        {status === 'unauthenticated' && commentsEnabled ? (
          <p className="border-t border-border pt-3 text-sm text-muted-foreground">
            برای ثبت نظر{' '}
            <Link href="/login" className="font-medium text-brand">
              وارد شو
            </Link>
          </p>
        ) : null}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      <CommentReportModal
        isOpen={!!reportCommentId}
        onClose={() => setReportCommentId(null)}
        reportEndpoint={
          reportCommentId ? `/api/lists/comments/${reportCommentId}/report` : ''
        }
        onReportSuccess={handleReportSuccess}
      />
    </section>
  );
}
