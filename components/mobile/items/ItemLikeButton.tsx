'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';

type LikeState = { isLiked: boolean; likeCount: number };

interface ItemLikeButtonProps {
  itemId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  /** hero = روی hero تیره · compact = آیکون گرد در نوار پایین */
  variant?: 'default' | 'hero' | 'compact';
}

export default function ItemLikeButton({
  itemId,
  initialLikeCount = 0,
  initialIsLiked = false,
  variant = 'default',
}: ItemLikeButtonProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${itemId}`)}`;

  // وضعیت لایک با react-query کش می‌شود تا ناوبری بین آیتم‌ها (مودال پیش‌نمایش)
  // و بازدید مجدد همان آیتم، درخواست تکراری نزند.
  const { data } = useQuery<LikeState>({
    queryKey: ['item-like', itemId],
    queryFn: async () => {
      const response = await fetch(`/api/items/${itemId}/like`);
      const json = await response.json();
      if (!response.ok || !json.success) {
        return { isLiked: initialIsLiked, likeCount: initialLikeCount };
      }
      return json.data as LikeState;
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  const isLiked = data?.isLiked ?? initialIsLiked;
  const likeCount = data?.likeCount ?? initialLikeCount;

  const { mutate: toggleLike, isPending: isLoading } = useMutation({
    mutationFn: async (): Promise<LikeState> => {
      const response = await fetch(`/api/items/${itemId}/like`, { method: 'POST' });
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'like toggle failed');
      return json.data as LikeState;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(['item-like', itemId], next);
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

  if (status === 'loading') {
    return (
      <div
        className={`h-10 animate-pulse ${
          isHero ? 'w-14 rounded-lg bg-white/20' : 'w-10 rounded-full bg-gray-200'
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
          className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all"
          aria-label="ورود برای پسندیدن"
        >
          <Heart className="w-5 h-5 text-gray-500" />
          {likeCount > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[1.125rem] h-[1.125rem] px-0.5 bg-gray-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {likeCount > 99 ? '۹۹+' : countLabel}
            </span>
          )}
        </Link>
      );
    }

    return (
      <Link
        href={loginHref}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
          isHero
            ? 'bg-white/15 text-white border border-white/20 hover:bg-white/25 backdrop-blur-sm'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="ورود برای پسندیدن"
      >
        <Heart className={`w-4 h-4 ${isHero ? 'text-white/90' : 'text-gray-400'}`} />
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
        className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all disabled:opacity-50 ${
          isLiked
            ? 'bg-red-50 border-2 border-red-200 hover:bg-red-100'
            : 'bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50'
        }`}
        aria-label={isLiked ? 'حذف لایک' : 'لایک'}
      >
        <Heart
          className={`w-5 h-5 transition-all ${
            isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'
          }`}
        />
        {likeCount > 0 && (
          <span className="absolute -top-1 -left-1 min-w-[1.125rem] h-[1.125rem] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {likeCount > 99 ? '۹۹+' : countLabel}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
        isLiked
          ? isHero
            ? 'bg-white/25 text-white border border-white/30'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
          : isHero
            ? 'bg-white/15 text-white border border-white/20 hover:bg-white/25 backdrop-blur-sm'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
      aria-label={isLiked ? 'حذف لایک' : 'لایک'}
    >
      <Heart
        className={`w-4 h-4 transition-all ${
          isLiked
            ? isHero
              ? 'fill-white text-white'
              : 'fill-red-500 text-red-500'
            : isHero
              ? 'text-white/90'
              : 'text-gray-400'
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
