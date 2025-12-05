'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { categories } from '@prisma/client';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  image: string | null;
  itemId?: string;
  slug?: string;
  category: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color'>;
  createdAt: string;
}

interface LikesTabProps {
  userId: string;
}

export default function LikesTab({ userId }: LikesTabProps) {
  const [likes, setLikes] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchLikes();
  }, [userId, page]);

  const fetchLikes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/activity?type=likes&limit=20`);
      const data = await response.json();

      if (data.success) {
        setLikes(data.data.activities);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && likes.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (likes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <p className="text-gray-500">هنوز آیتمی لایک نکرده‌اید</p>
      </div>
    );
  }

  const displayedLikes = showAll ? likes : likes.slice(0, 8);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {displayedLikes.map((like) => (
          <Link
            key={like.id}
            href={`/items/${like.itemId || like.id}`}
            className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            {like.image ? (
              <div className="relative h-40 bg-gradient-to-br from-purple-100 to-blue-100">
                <ImageWithFallback
                  src={like.image}
                  alt={like.title}
                  className="w-full h-full object-cover"
                  fallbackIcon={like.category.icon}
                  fallbackClassName="h-full w-full"
                />
              </div>
            ) : (
              <div className="relative h-40 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <span className="text-4xl">{like.category.icon}</span>
              </div>
            )}
            <div className="p-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-sm">{like.category.icon}</span>
                <span className="text-xs text-gray-500 truncate">{like.category.name}</span>
              </div>
              <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-tight">{like.title}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <span>❤️</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!showAll && likes.length > 8 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          مشاهده بیشتر ({likes.length - 8} مورد دیگر)
        </button>
      )}
    </div>
  );
}

