'use client';

import { useState } from 'react';
import { Heart, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Image from 'next/image';
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
    <div className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.users.image ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={comment.users.image}
              alt={comment.users.name || comment.users.email}
              fill
              className="object-cover"
              unoptimized={true}
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-sm">
              {(comment.users.name || comment.users.email).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 text-sm">
            {comment.users.name || comment.users.email.split('@')[0]}
          </span>
          {comment.users.curatorLevel && (
            <CuratorBadge level={comment.users.curatorLevel} size="small" glow={false} />
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

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`flex items-center gap-1 text-xs transition-colors ${
              localIsLiked
                ? 'text-red-500'
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${localIsLiked ? 'fill-current' : ''}`}
            />
            <span>{localLikeCount}</span>
          </button>

          <button
            onClick={() => onReport(comment.id)}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <Flag className="w-4 h-4" />
            <span>گزارش</span>
          </button>
        </div>
      </div>
    </div>
  );
}

