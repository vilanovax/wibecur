'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star } from 'lucide-react';

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
    lg: 'px-6 py-3 text-lg',
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
      className={`${buttonSizeClasses[size]} flex items-center gap-2 rounded-xl font-medium transition-all disabled:opacity-50 ${
        isBookmarked
          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary'
      }`}
      aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره این لیست'}
    >
      <Star
        className={`${sizeClasses[size === 'lg' ? 'md' : 'sm']} ${
          isBookmarked ? 'fill-current text-yellow-600' : ''
        }`}
      />
      <span>{isBookmarked ? labelSaved : labelSave}</span>
      {bookmarkCount > 0 && (
        <span className="text-xs opacity-70">({bookmarkCount})</span>
      )}
    </button>
  );
}

