'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';

interface ItemLikeButtonProps {
  itemId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
}

export default function ItemLikeButton({
  itemId,
  initialLikeCount = 0,
  initialIsLiked = false,
}: ItemLikeButtonProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch like status if user is logged in and initial values not provided
  useEffect(() => {
    if (session?.user && initialIsLiked === false && initialLikeCount === 0) {
      fetchLikeStatus();
    }
  }, [session, itemId]);

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

    if (!session?.user) {
      // Could redirect to login or show message
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/items/${itemId}/like`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setIsLiked(data.data.isLiked);
        setLikeCount(data.data.likeCount);
        console.log('Like toggled:', {
          isLiked: data.data.isLiked,
          likeCount: data.data.likeCount,
        });
      } else {
        console.error('Error toggling like:', data.error);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if user is not logged in
  if (!session?.user) {
    return (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Heart className="w-5 h-5 text-gray-400" />
        <span>{likeCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
        isLiked
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
      aria-label={isLiked ? 'حذف لایک' : 'لایک'}
    >
      <Heart
        className={`w-4 h-4 transition-all ${
          isLiked
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400'
        }`}
      />
      <span className={`text-sm font-medium ${
        isLiked ? 'text-red-600' : 'text-gray-700'
      }`}>
        {likeCount}
      </span>
    </button>
  );
}

