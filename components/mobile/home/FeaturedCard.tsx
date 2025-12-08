'use client';

import Link from 'next/link';
import { Heart, Star, FileText } from 'lucide-react';
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
  title: 'بهترین فیلم‌های عاشقانه ۲۰۲۵',
  description: 'لیست کامل فیلم‌های عاشقانه که باید ببینی',
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
      <Link href={`/lists/${featuredList.id}`} className="block">
        <div className="relative h-56 rounded-2xl overflow-hidden group cursor-pointer bg-gradient-to-br from-gray-200 to-gray-300 shadow-md">
          <ImageWithFallback
            src={featuredList.coverImage}
            alt={featuredList.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallbackIcon="🎬"
            fallbackClassName="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          {/* Badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {badgeLabels[featuredList.badge]}
            </span>
          </div>

          {/* Content */}
          <div className="absolute bottom-4 right-4 left-4">
            <h3 className="text-white text-xl font-bold mb-1 drop-shadow-lg">
              {featuredList.title}
            </h3>
            <p className="text-white/90 text-sm mb-3 drop-shadow line-clamp-2">
              {featuredList.description}
            </p>
            <div className="flex items-center gap-4 text-white/90 text-sm">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 fill-current" />
                {featuredList.likes}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" />
                {featuredList.saves}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {featuredList.itemCount} آیتم
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

