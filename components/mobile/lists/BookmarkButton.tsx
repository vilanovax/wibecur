'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bookmark, Check } from 'lucide-react';
import { track } from '@/lib/analytics';

interface BookmarkButtonProps {
  listId: string;
  initialIsBookmarked?: boolean;
  initialBookmarkCount?: number;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  labelSave?: string;
  labelSaved?: string;
  onToggle?: (isBookmarked: boolean) => void;
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
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount);
  const [isLoading, setIsLoading] = useState(false);

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

  if (!session?.user) {
    return null;
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

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`${sizeClasses[size]} flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 ${
          isBookmarked ? 'text-primary' : 'text-wibe-secondary'
        }`}
        aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
      >
        <Bookmark className={`w-full h-full ${isBookmarked ? 'fill-current' : ''}`} />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`${buttonSizeClasses[size]} flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-300 disabled:opacity-50 w-full ${
        isBookmarked
          ? 'bg-success/10 text-success border border-success/30 animate-saved-pulse'
          : 'bg-primary text-white hover:bg-primary-dark active:scale-[0.99] shadow-sm'
      }`}
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
