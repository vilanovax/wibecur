'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface FeaturedList {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  badge: 'trending' | 'new' | 'featured';
  likes: number;
  saves: number;
  itemCount: number;
}

const featuredList: FeaturedList = {
  id: '1',
  title: 'بهترین فیلم‌های عاشقانه 2025',
  description: 'لیستی برای شب‌هایی که حال و هوا مهمه',
  coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
  badge: 'trending',
  likes: 234,
  saves: 89,
  itemCount: 10,
};

const badgeLabels = {
  trending: '🔥 ترند هفته',
  new: '✨ جدید',
  featured: '⭐ ویژه',
};

export default function FeaturedCard() {
  return (
    <div className="px-4 mb-6">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 shadow-md">
        <div className="relative h-48">
          <ImageWithFallback
            src={featuredList.coverImage}
            alt={featuredList.title}
            className="w-full h-full object-cover"
            fallbackIcon="🎬"
            fallbackClassName="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {badgeLabels[featuredList.badge]}
            </span>
          </div>
          <div className="absolute bottom-3 right-4 left-4">
            <h3 className="text-white text-lg font-bold drop-shadow-lg">
              {featuredList.title}
            </h3>
            <p className="text-white/90 text-sm mt-0.5 drop-shadow line-clamp-1">
              {featuredList.description}
            </p>
            <p className="text-white/90 text-xs mt-1">
              ⭐ {featuredList.saves} &nbsp; • &nbsp; {featuredList.itemCount} آیتم
            </p>
          </div>
        </div>
        <div className="p-3 bg-white flex gap-2">
          <button
            type="button"
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            ذخیره کن ⭐
          </button>
          <Link
            href={`/lists/${featuredList.id}`}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium text-center hover:bg-gray-50 transition-colors"
          >
            مشاهده لیست
          </Link>
        </div>
      </div>
    </div>
  );
}

