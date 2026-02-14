'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star, Check } from 'lucide-react';

interface BookmarkButtonProps {
  listId: string;
  initialIsBookmarked?: boolean;
  initialBookmarkCount?: number;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  labelSave?: string;
  labelSaved?: string;
  /** بعد از تغییر وضعیت ذخیره/حذف فراخوانی می‌شود */
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

  // Fetch bookmark status if user is logged in and initial values not provided
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

    if (!session?.user) {
      // Redirect to login or show message
      return;
    }

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
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if user is not logged in
  if (!session?.user) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const buttonSizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-sm h-12',
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`${sizeClasses[size]} flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 ${
          isBookmarked ? 'text-yellow-500' : 'text-gray-400'
        }`}
        aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
      >
        <Star
          className={`w-full h-full ${
            isBookmarked ? 'fill-current' : ''
          }`}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`${buttonSizeClasses[size]} flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 w-full ${
        isBookmarked
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 animate-saved-pulse'
          : 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-800 border border-violet-200/50 hover:from-violet-100 hover:to-purple-100 active:scale-[0.99] shadow-sm'
      }`}
      aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
    >
      {isBookmarked ? (
        <Check className={`${sizeClasses[size === 'lg' ? 'md' : 'sm']}`} />
      ) : (
        <Star className={sizeClasses[size === 'lg' ? 'md' : 'sm']} />
      )}
      <span>{isBookmarked ? labelSaved : labelSave}</span>
      {bookmarkCount > 0 && (
        <span className="text-xs opacity-80">({bookmarkCount})</span>
      )}
    </button>
  );
}

