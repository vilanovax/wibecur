'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bookmark, Check } from 'lucide-react';
import { track } from '@/lib/analytics';

interface BookmarkButtonProps {
  listId: string;
  initialIsBookmarked?: boolean;
  initialBookmarkCount?: number;
  variant?: 'icon' | 'button' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  labelSave?: string;
  labelSaved?: string;
  onToggle?: (isBookmarked: boolean) => void;
  className?: string;
}

export default function BookmarkButton({
  listId,
  initialIsBookmarked = false,
  initialBookmarkCount = 0,
  variant = 'icon',
  size = 'md',
  labelSave = 'ذخیره',
  labelSaved = 'ذخیره شده',
  onToggle,
  className = '',
}: BookmarkButtonProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount);
  const [isLoading, setIsLoading] = useState(false);

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/lists/${listId}`)}`;
  const isCompact = variant === 'compact';

  useEffect(() => {
    if (session?.user && initialIsBookmarked === false && initialBookmarkCount === 0) {
      fetchBookmarkStatus();
    }
  }, [session, listId]);

  const fetchBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/lists/${listId}/bookmark-status`);
      const data = await response.json();

      if (data.success) {
        setIsBookmarked(data.data.isBookmarked);
      }
    } catch (error) {
      console.error('Error fetching bookmark status:', error);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/lists/${listId}/bookmark`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setIsBookmarked(data.data.isBookmarked);
        setBookmarkCount(data.data.bookmarkCount);
        onToggle?.(data.data.isBookmarked);
        track(data.data.isBookmarked ? 'list_bookmark' : 'list_unbookmark', { listId });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div
        className={`animate-pulse rounded-full bg-gray-200 ${
          isCompact || variant === 'icon' ? 'h-10 w-10' : 'h-12 w-full'
        }`}
        aria-hidden
      />
    );
  }

  if (status === 'unauthenticated') {
    if (variant === 'icon') {
      return (
        <Link
          href={loginHref}
          className="flex h-full w-full items-center justify-center text-gray-600 transition-colors hover:text-primary"
          aria-label="ورود برای ذخیره لیست"
          title="ورود برای ذخیره لیست"
        >
          <Bookmark className="h-5 w-5" />
        </Link>
      );
    }

    if (isCompact) {
      return (
        <Link
          href={loginHref}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 bg-white transition-all hover:border-primary hover:bg-primary/5"
          aria-label="ورود برای ذخیره لیست"
          title="ورود برای ذخیره لیست"
        >
          <Bookmark className="h-5 w-5 text-gray-500" />
        </Link>
      );
    }

    return (
      <Link
        href={loginHref}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
      >
        <Bookmark className="h-5 w-5" />
        <span>ورود برای ذخیره لیست</span>
      </Link>
    );
  }

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const buttonSizeClasses = {
    sm: 'px-3 py-1.5 wibe-small',
    md: 'px-4 py-2 wibe-body',
    lg: 'px-5 py-3 wibe-small h-12',
  };

  if (isCompact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all disabled:opacity-50 ${
          isBookmarked
            ? 'border-primary bg-primary/10 hover:bg-primary/15'
            : 'border-gray-200 bg-white hover:border-primary hover:bg-primary/5'
        }`}
        aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
        title={isBookmarked ? 'ذخیره شده' : 'ذخیره لیست'}
      >
        <Bookmark
          className={`h-5 w-5 transition-all ${
            isBookmarked ? 'fill-primary text-primary' : 'text-gray-500'
          }`}
        />
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`${sizeClasses[size]} flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 ${
          isBookmarked ? 'text-primary' : 'text-gray-600'
        }`}
        aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
      >
        <Bookmark className={`h-full w-full ${isBookmarked ? 'fill-current' : ''}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`${buttonSizeClasses[size]} flex w-full items-center justify-center gap-2 rounded-md font-semibold transition-all duration-300 disabled:opacity-50 ${
        isBookmarked
          ? 'animate-saved-pulse border border-success/30 bg-success/10 text-success'
          : 'bg-primary text-white shadow-sm hover:bg-primary-dark active:scale-[0.99]'
      } ${className}`}
      aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
    >
      {isBookmarked ? (
        <Check className={sizeClasses[size === 'lg' ? 'md' : 'sm']} />
      ) : (
        <Bookmark className={sizeClasses[size === 'lg' ? 'md' : 'sm']} />
      )}
      <span>{isBookmarked ? labelSaved : labelSave}</span>
      {bookmarkCount > 0 && (
        <span className="wibe-caption opacity-80">({bookmarkCount.toLocaleString('fa-IR')})</span>
      )}
    </button>
  );
}
