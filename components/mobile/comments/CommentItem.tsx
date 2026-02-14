'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, Flag, Trash2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import CommentAvatar from '@/components/shared/CommentAvatar';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    isFiltered: boolean;
    likeCount: number;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      username?: string | null;
      image: string | null;
      curatorLevel?: string;
      avatarType?: string;
      avatarId?: string | null;
      avatarStatus?: string | null;
    };
    isLiked: boolean;
    canDelete: boolean;
  };
  onLike: (commentId: string) => void;
  onReport: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  isLoading?: boolean;
}

export default function CommentItem({
  comment,
  onLike,
  onReport,
  onDelete,
  isLoading = false,
}: CommentItemProps) {
  const [localIsLiked, setLocalIsLiked] = useState(comment.isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(comment.likeCount);

  const handleLike = async () => {
    setLocalIsLiked(!localIsLiked);
    setLocalLikeCount((prev) => (localIsLiked ? prev - 1 : prev + 1));
    onLike(comment.id);
  };

  const profileUrl = comment.user.username ? `/u/${encodeURIComponent(comment.user.username)}` : null;

  return (
    <div className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100">
      {/* Avatar (+ Elite badge if level 5+) — کلیک → پروفایل */}
      <div className="flex-shrink-0 relative">
        {profileUrl ? (
          <Link href={profileUrl} className="block">
            <CommentAvatar
              src={comment.user.image}
              name={comment.user.name}
              email={comment.user.email}
              size={40}
              avatarType={comment.user.avatarType}
              avatarId={comment.user.avatarId}
              avatarStatus={comment.user.avatarStatus}
            />
          </Link>
        ) : (
          <CommentAvatar
            src={comment.user.image}
            name={comment.user.name}
            email={comment.user.email}
            size={40}
            avatarType={comment.user.avatarType}
            avatarId={comment.user.avatarId}
            avatarStatus={comment.user.avatarStatus}
          />
        )}
        {(comment.user.curatorLevel === 'ELITE_CURATOR' || comment.user.curatorLevel === 'VIBE_LEGEND') && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px]" title="Elite Curator">👑</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          {profileUrl ? (
            <Link href={profileUrl} className="font-medium text-gray-900 text-sm hover:text-primary transition-colors">
              {comment.user.name}
            </Link>
          ) : (
            <span className="font-medium text-gray-900 text-sm">
              {comment.user.name}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
              locale: faIR,
            })}
          </span>
        </div>

        {/* Comment Text */}
        <p
          className={`text-gray-700 text-sm mb-2 ${
            comment.isFiltered ? 'text-gray-500 italic' : ''
          }`}
        >
          {comment.content}
        </p>

        {/* Actions — Vibe 2.0: مفید بود + پاسخ */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`flex items-center gap-1 text-xs transition-colors ${
              localIsLiked
                ? 'text-primary'
                : 'text-gray-500 hover:text-primary'
            }`}
          >
            <ThumbsUp
              className={`w-4 h-4 ${localIsLiked ? 'fill-current' : ''}`}
            />
            <span>{localLikeCount} مفید بود</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>پاسخ</span>
          </button>

          <button
            onClick={() => onReport(comment.id)}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors mr-auto"
          >
            <Flag className="w-4 h-4" />
            <span>گزارش</span>
          </button>

          {comment.canDelete && (
            <button
              onClick={() => {
                if (confirm('آیا از حذف این کامنت اطمینان دارید؟')) {
                  onDelete(comment.id);
                }
              }}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

