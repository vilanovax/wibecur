'use client';

import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

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
    <Link href={`/lists/${id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
        {/* Image with gradient overlay */}
        <div className="relative h-44 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          <ImageWithFallback
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallbackIcon="📋"
            fallbackClassName="w-full h-full"
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

