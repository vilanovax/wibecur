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
  variant?: 'default' | 'compact';
  /** برای لینک به صفحه لیست (مسیر با slug است) */
  slug?: string;
  /** برای تصاویر بالای صفحه: اولویت لود بالا */
  priority?: boolean;
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
  variant = 'default',
  slug,
  priority,
}: ListCardProps) {
  const listHref = `/lists/${slug ?? id}`;
  const isCompact = variant === 'compact';
  if (isCompact) {
    return (
      <Link href={listHref} className="block">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-row-reverse gap-0">
          <div className="relative w-24 h-24 flex-shrink-0 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
            <ImageWithFallback src={coverImage} alt={title} className="w-full h-full object-cover" fallbackIcon="📋" fallbackClassName="w-full h-full" priority={priority} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
          <div className="flex-1 flex flex-col justify-center p-3 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{title}</h3>
            {description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{description}</p>}
            <p className="text-gray-500 text-xs mt-1">{itemCount} آیتم &nbsp; • &nbsp; ⭐ {saves}</p>
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link href={listHref} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100">
        <div className="relative h-40 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          <ImageWithFallback src={coverImage} alt={title} className="w-full h-full object-cover" fallbackIcon="📋" fallbackClassName="w-full h-full" priority={priority} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {badge && (
            <div className="absolute top-2 right-2">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badgeLabels[badge]}</span>
            </div>
          )}
          <div className="absolute bottom-2 right-2 left-2">
            <h3 className="text-white font-bold text-base drop-shadow-lg line-clamp-2">{title}</h3>
          </div>
        </div>
        <div className="p-3">
          <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
            <span className="inline-flex items-center gap-0.5"><Heart className="w-3.5 h-3.5 text-red-500" />{likes}</span>
            <span className="inline-flex items-center gap-0.5"><Star className="w-3.5 h-3.5 text-yellow-500" />{saves}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

