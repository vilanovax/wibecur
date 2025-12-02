'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { categories, lists } from '@prisma/client';

type ListWithCategory = lists & {
  categories: Pick<categories, 'id' | 'name' | 'slug' | 'icon' | 'color'>;
  _count: {
    items: number;
    list_likes: number;
    bookmarks: number;
  };
};

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  image: string | null;
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
        <p className="text-gray-500">هنوز لیستی لایک نکرده‌اید</p>
      </div>
    );
  }

  const displayedLikes = showAll ? likes : likes.slice(0, 4);

  return (
    <div className="space-y-4">
      {displayedLikes.map((like) => (
        <Link
          key={like.id}
          href={`/lists/${like.slug || like.title.replace(/\s+/g, '-').toLowerCase()}`}
          className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
          {like.image && (
            <div className="relative h-48">
              <Image
                src={like.image}
                alt={like.title}
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{like.category.icon}</span>
              <span className="text-xs text-gray-500">{like.category.name}</span>
              <span className="ml-auto text-xs text-gray-400">❤️ لایک شده</span>
            </div>
            <h3 className="font-bold text-lg mb-2">{like.title}</h3>
            {like.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {like.description}
              </p>
            )}
          </div>
        </Link>
      ))}

      {!showAll && likes.length > 4 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          مشاهده بیشتر ({likes.length - 4} مورد دیگر)
        </button>
      )}
    </div>
  );
}

