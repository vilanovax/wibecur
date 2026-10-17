'use client';

import { useState } from 'react';
import { Heart, Flag } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import CommentAvatar from '@/components/shared/CommentAvatar';
import CuratorBadge from '@/components/shared/CuratorBadge';

interface ListCommentItemProps {
  comment: {
    id: string;
    content: string;
    isFiltered: boolean;
    likeCount: number;
    createdAt: string;
    users: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      curatorLevel?: string | null;
    };
    userLiked: boolean;
  };
  onLike: (commentId: string) => void;
  onReport: (commentId: string) => void;
  isLoading?: boolean;
}

export default function ListCommentItem({
  comment,
  onLike,
  onReport,
  isLoading = false,
}: ListCommentItemProps) {
  const [localIsLiked, setLocalIsLiked] = useState(comment.userLiked);
  const [localLikeCount, setLocalLikeCount] = useState(comment.likeCount);

  const handleLike = async () => {
    setLocalIsLiked(!localIsLiked);
    setLocalLikeCount((prev) => (localIsLiked ? prev - 1 : prev + 1));
    onLike(comment.id);
  };

  return (
    <div className="flex gap-3 rounded-surface border border-border bg-popover p-4">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <CommentAvatar
          src={comment.users.image}
          name={comment.users.name}
          email={comment.users.email}
          size={40}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-medium text-foreground text-sm">
            {comment.users.name || comment.users.email.split('@')[0]}
          </span>
          {comment.users.curatorLevel && (
            <CuratorBadge level={comment.users.curatorLevel} size="small" glow={false} />
          )}
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        {/* Comment Text */}
        <p
          className={`text-foreground text-sm mb-2 ${
            comment.isFiltered ? 'italic text-muted-foreground' : ''
          }`}
        >
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`inline-flex min-h-11 items-center gap-1 px-1 text-sm transition-colors ${
              localIsLiked
                ? 'text-destructive'
                : 'text-muted-foreground hover:text-destructive'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${localIsLiked ? 'fill-current' : ''}`}
            />
            <span>{localLikeCount.toLocaleString('fa-IR')}</span>
          </button>

          <button
            onClick={() => onReport(comment.id)}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center gap-1 px-1 text-sm text-muted-foreground transition-colors hover:text-warning"
          >
            <Flag className="w-4 h-4" />
            <span>گزارش</span>
          </button>
        </div>
      </div>
    </div>
  );
}

