'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { signOutIfStaleSession } from '@/lib/session-client';
import { useDeferReady } from '@/hooks/useDeferReady';
import {
  invalidateItemViewerState,
  useItemViewerState,
} from '@/hooks/useItemViewerState';

interface ItemLikeButtonProps {
  itemId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  variant?: 'default' | 'hero' | 'compact';
  deferViewerState?: boolean;
}

export default function ItemLikeButton({
  itemId,
  initialLikeCount = 0,
  initialIsLiked = false,
  variant = 'default',
  deferViewerState = false,
}: ItemLikeButtonProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const deferReady = useDeferReady(deferViewerState);

  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${itemId}`)}`;

  const { data: viewerState, isLoading: viewerLoading } = useItemViewerState(itemId, {
    enabled: deferReady,
    initialLikeCount,
  });

  const isLiked = viewerState?.like.isLiked ?? initialIsLiked;
  const likeCount = viewerState?.like.likeCount ?? initialLikeCount;

  const { mutate: toggleLike, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/items/${itemId}/like`, { method: 'POST' });
      const json = await response.json();
      if (await signOutIfStaleSession(response, json)) {
        throw new Error('نشست نامعتبر است؛ لطفاً دوباره وارد شوید');
      }
      if (!json.success) throw new Error(json.error || 'like toggle failed');
      return json.data as { isLiked: boolean; likeCount: number };
    },
    onSuccess: () => {
      invalidateItemViewerState(queryClient, itemId);
    },
    onError: (error) => {
      console.error('Error toggling like:', error);
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) return;
    toggleLike();
  };

  const countLabel = likeCount > 0 ? likeCount.toLocaleString('fa-IR') : null;

  if (status === 'loading' || (deferReady && viewerLoading && !viewerState)) {
    return (
      <div
        className={`h-10 animate-pulse ${
          isHero ? 'w-14 rounded-lg bg-white/20' : 'w-10 rounded-full bg-wibe-surface'
        }`}
        aria-hidden
      />
    );
  }

  if (status === 'unauthenticated') {
    if (isCompact) {
      return (
        <Link
          href={loginHref}
          className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full border border-wibe bg-wibe-card px-2.5 text-wibe-secondary transition-colors hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="ورود برای پسندیدن"
        >
          <Heart className="h-4 w-4 shrink-0" />
          {countLabel ? (
            <span className="wibe-caption font-bold tabular-nums text-wibe-secondary">
              {likeCount > 99 ? '۹۹+' : countLabel}
            </span>
          ) : null}
        </Link>
      );
    }

    return (
      <Link
        href={loginHref}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
          isHero
            ? 'bg-white/15 text-white border border-white/20 hover:bg-white/25 backdrop-blur-sm'
            : 'bg-gray-50 text-wibe-secondary hover:bg-gray-100'
        }`}
        aria-label="ورود برای پسندیدن"
      >
        <Heart className={`w-4 h-4 ${isHero ? 'text-white/90' : 'text-wibe-secondary'}`} />
        {countLabel && !isCompact && <span className="text-sm font-medium">{countLabel}</span>}
      </Link>
    );
  }

  if (isCompact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full border px-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 ${
          isLiked
            ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
            : 'border-wibe bg-wibe-card text-wibe-secondary hover:border-red-300 hover:bg-red-50'
        }`}
        aria-label={isLiked ? 'حذف لایک' : 'لایک'}
      >
        <Heart
          className={`h-4 w-4 shrink-0 transition-colors ${
            isLiked ? 'fill-red-500 text-red-500' : ''
          }`}
        />
        {countLabel ? (
          <span className={`wibe-caption font-bold tabular-nums ${isLiked ? 'text-red-600' : ''}`}>
            {likeCount > 99 ? '۹۹+' : countLabel}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isLiked
          ? isHero
            ? 'bg-white/25 text-white border border-white/30'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
          : isHero
            ? 'bg-white/15 text-white border border-white/20 hover:bg-white/25 backdrop-blur-sm'
            : 'bg-gray-50 text-wibe-secondary hover:bg-gray-100'
      }`}
      aria-label={isLiked ? 'حذف لایک' : 'لایک'}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          isLiked
            ? isHero
              ? 'fill-white text-white'
              : 'fill-red-500 text-red-500'
            : isHero
              ? 'text-white/90'
              : 'text-wibe-secondary'
        }`}
      />
      {countLabel && (
        <span className={`text-sm font-medium ${isLiked && !isHero ? 'text-red-600' : ''}`}>
          {countLabel}
        </span>
      )}
    </button>
  );
}
