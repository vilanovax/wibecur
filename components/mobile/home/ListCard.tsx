'use client';

import Link from 'next/link';
import { Heart, Star } from 'lucide-react';

interface ListCardProps {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  badge?: 'trending' | 'new' | 'featured';
  likes: number;
  saves: number;
  itemCount: number;
}

const badgeLabels = {
  trending: '🔥 ترند',
  new: '✨ جدید',
  featured: '⭐ ویژه',
};

export default function ListCard({
  id,
  title,
  description,
  coverImage,
  badge,
  likes,
  saves,
  itemCount,
}: ListCardProps) {
  return (
    <Link href={`/lists/${id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
        {/* Image with gradient overlay */}
        <div className="relative h-40">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://via.placeholder.com/400x200/6366F1/ffffff?text=' +
                encodeURIComponent(title);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* Badge */}
          {badge && (
            <div className="absolute top-3 right-3">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {badgeLabels[badge]}
              </span>
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-3 right-3 left-3">
            <h3 className="text-white font-bold text-lg drop-shadow-lg line-clamp-2">
              {title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {description}
          </p>

          {/* Footer metrics */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-gray-700">
                <Heart className="w-4 h-4 text-red-500" />
                {likes}
              </span>
              <span className="flex items-center gap-1 text-gray-700">
                <Star className="w-4 h-4 text-yellow-500" />
                {saves}
              </span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {itemCount} آیتم
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

