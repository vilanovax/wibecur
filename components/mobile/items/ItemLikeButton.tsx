'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { LikeButton } from '@/components/animations/like-button';
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
    // Guests use SSR likeCount — skip viewer-state round-trip
    enabled: deferReady && status === 'authenticated',
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
        className={`size-11 animate-pulse ${
          isHero ? 'w-14 rounded-lg bg-background/20' : 'rounded-full bg-muted'
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
          className="relative flex size-11 items-center justify-center rounded-full border border-border bg-popover"
          aria-label="ورود برای پسندیدن"
        >
          <Heart className="size-5 text-muted-foreground" />
          {likeCount > 0 && (
            <span className="absolute -top-1 end-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-brand-foreground">
              {likeCount > 99 ? '۹۹+' : countLabel}
            </span>
          )}
        </Link>
      );
    }

    return (
      <Link
        href={loginHref}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
          isHero
            ? 'bg-background/15 text-background border border-background/20 hover:bg-background/25 backdrop-blur-sm'
            : 'h-11 rounded-control bg-muted text-muted-foreground'
        }`}
        aria-label="ورود برای پسندیدن"
      >
        <Heart className={`size-4 ${isHero ? 'text-background/90' : 'text-muted-foreground'}`} />
        {countLabel && !isCompact && <span className="text-sm font-medium">{countLabel}</span>}
      </Link>
    );
  }

  if (!isHero) {
    return (
      <span
        className="inline-flex"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <LikeButton
          liked={isLiked}
          count={Math.max(0, likeCount - (isLiked ? 1 : 0))}
          onChange={() => {
            if (!isLoading && session?.user) toggleLike();
          }}
          className={isLoading ? 'pointer-events-none h-11 opacity-60' : 'h-11'}
        />
      </span>
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
            ? 'bg-background/25 text-background border border-background/30'
            : 'h-11 rounded-control bg-destructive/10 text-destructive'
          : isHero
            ? 'bg-background/15 text-background border border-background/20 hover:bg-background/25 backdrop-blur-sm'
            : 'h-11 rounded-control bg-muted text-muted-foreground'
      }`}
      aria-label={isLiked ? 'حذف لایک' : 'لایک'}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          isLiked
            ? isHero
              ? 'fill-background text-background'
              : 'fill-destructive text-destructive'
            : isHero
              ? 'text-background/90'
              : 'text-muted-foreground'
        }`}
      />
      {countLabel && (
        <span className={`text-sm font-medium ${isLiked && !isHero ? 'text-destructive' : ''}`}>
          {countLabel}
        </span>
      )}
    </button>
  );
}
