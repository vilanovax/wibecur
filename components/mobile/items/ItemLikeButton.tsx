'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';

interface ItemLikeButtonProps {
  itemId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  variant?: 'default' | 'hero';
}

export default function ItemLikeButton({
  itemId,
  initialLikeCount = 0,
  initialIsLiked = false,
  variant = 'default',
}: ItemLikeButtonProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  const isHero = variant === 'hero';
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${itemId}`)}`;

  useEffect(() => {
    if (session?.user && initialIsLiked === false && initialLikeCount === 0) {
      fetchLikeStatus();
    }
  }, [session, itemId, initialIsLiked, initialLikeCount]);

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/items/${itemId}/like`);
      const data = await response.json();
      if (data.success) {
        setIsLiked(data.data.isLiked);
        setLikeCount(data.data.likeCount);
      }
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/items/${itemId}/like`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setIsLiked(data.data.isLiked);
        setLikeCount(data.data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const countLabel = likeCount > 0 ? likeCount.toLocaleString('fa-IR') : null;

  if (status === 'loading') {
    return (
      <div
        className={`h-10 rounded-lg animate-pulse ${isHero ? 'w-14 bg-white/20' : 'w-14 bg-gray-200'}`}
        aria-hidden
      />
    );
  }

  if (status === 'unauthenticated') {
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
        {countLabel && <span className="text-sm font-medium">{countLabel}</span>}
      </Link>
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
