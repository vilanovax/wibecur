'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bookmark, Check } from 'lucide-react';
import { track, listAnalyticsPayload, trackFirstBookmark, type ListAnalyticsContext } from '@/lib/analytics';

interface BookmarkButtonProps {
  listId: string;
  initialIsBookmarked?: boolean;
  initialBookmarkCount?: number;
  variant?: 'icon' | 'button' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  /** primary: CTA پررنگ | secondary: outline/خنثی */
  tone?: 'primary' | 'secondary';
  labelSave?: string;
  labelSaved?: string;
  onToggle?: (isBookmarked: boolean) => void;
  className?: string;
  analytics?: ListAnalyticsContext;
  /** نمایش تعداد ذخیره کنار دکمه (پیش‌فرض: true) */
  showCount?: boolean;
}

export default function BookmarkButton({
  listId,
  initialIsBookmarked = false,
  initialBookmarkCount = 0,
  variant = 'icon',
  size = 'md',
  tone = 'primary',
  labelSave = 'ذخیره',
  labelSaved = 'ذخیره شده',
  onToggle,
  className = '',
  analytics,
  showCount = true,
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
        const payload = listAnalyticsPayload({ listId, ...analytics });
        track(
          data.data.isBookmarked ? 'list_bookmark' : 'list_unbookmark',
          payload
        );
        if (data.data.isBookmarked && data.data.isFirstBookmark) {
          trackFirstBookmark({
            list_slug: analytics?.listSlug ?? undefined,
            category_slug: analytics?.categorySlug ?? undefined,
            source: analytics?.source,
          });
        }
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
        className={`animate-pulse rounded-full bg-wibe-surface ${
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
          className="flex h-full w-full items-center justify-center text-wibe-secondary transition-colors hover:text-primary"
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
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-wibe bg-white transition-colors hover:border-primary hover:bg-primary/5"
          aria-label="ورود برای ذخیره لیست"
          title="ورود برای ذخیره لیست"
        >
          <Bookmark className="h-5 w-5 text-wibe-secondary" />
        </Link>
      );
    }

    return (
      <Link
        href={loginHref}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
      >
        <Bookmark className="h-5 w-5" />
        <span>ورود برای ذخیره لیست</span>
      </Link>
    );
  }

  const iconGlyphClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5',
  };

  /** اندازهٔ گلیف داخل دکمهٔ متنی (نه hit-area) */
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const iconHitClasses = {
    sm: 'h-11 w-11 lg:h-8 lg:w-8',
    md: 'h-11 w-11',
    lg: 'h-12 w-12',
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
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-50 lg:h-10 lg:w-10 ${
          isBookmarked
            ? 'border-primary bg-primary/10 hover:bg-primary/15'
            : 'border-wibe bg-white hover:border-primary hover:bg-primary/5'
        }`}
        aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
        title={isBookmarked ? 'ذخیره شده' : 'ذخیره لیست'}
      >
        <Bookmark
          className={`h-5 w-5 transition-colors ${
            isBookmarked ? 'fill-primary text-primary' : 'text-wibe-secondary'
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
        className={`${iconHitClasses[size]} flex items-center justify-center transition-[colors,transform] hover:scale-110 disabled:opacity-50 ${className} ${
          isBookmarked ? 'text-primary' : 'text-wibe-secondary'
        }`}
        aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
      >
        <Bookmark className={`${iconGlyphClasses[size]} ${isBookmarked ? 'fill-current' : ''}`} />
      </button>
    );
  }

  const unsavedToneClasses =
    tone === 'secondary'
      ? 'border border-wibe bg-wibe-surface text-foreground shadow-none hover:bg-wibe-surface active:scale-[0.99]'
      : 'bg-primary text-white shadow-sm hover:bg-primary-dark active:scale-[0.99]';

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`${buttonSizeClasses[size]} flex w-full items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-300 disabled:opacity-50 ${
        isBookmarked
          ? 'animate-saved-pulse border border-success/30 bg-success/10 text-success'
          : unsavedToneClasses
      } ${className}`}
      aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
    >
      {isBookmarked ? (
        <Check className={sizeClasses[size === 'lg' ? 'md' : 'sm']} />
      ) : (
        <Bookmark className={sizeClasses[size === 'lg' ? 'md' : 'sm']} />
      )}
      <span>{isBookmarked ? labelSaved : labelSave}</span>
      {showCount && bookmarkCount > 0 && (
        <span className="wibe-caption opacity-80">({bookmarkCount.toLocaleString('fa-IR')})</span>
      )}
    </button>
  );
}
