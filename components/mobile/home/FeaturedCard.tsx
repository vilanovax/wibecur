'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface FeaturedList {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  badge?: 'trending' | 'new' | 'featured';
  likes: number;
  saves: number;
  itemCount: number;
}

const badgeLabels: Record<string, string> = {
  trending: '🔥 ترند هفته',
  new: '✨ جدید',
  featured: '⭐ ویژه',
};

export default function FeaturedCard() {
  const [list, setList] = useState<FeaturedList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lists/home')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.featured) {
          const f = json.data.featured;
          setList({
            id: f.id,
            title: f.title,
            slug: f.slug,
            description: f.description || '',
            coverImage: f.coverImage ?? '',
            badge: f.badge || 'featured',
            likes: f.likes ?? 0,
            saves: f.saveCount ?? 0,
            itemCount: f.itemCount ?? 0,
          });
        }
      })
      .catch(() => setList(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !list) {
    if (!loading && !list) return null;
    return (
      <div className="px-4 mb-6">
        <div className="rounded-2xl h-48 bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 mb-6">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 shadow-md">
        <div className="relative h-48">
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            className="w-full h-full object-cover"
            fallbackIcon="🎬"
            fallbackClassName="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {badgeLabels[list.badge ?? 'featured']}
            </span>
          </div>
          <div className="absolute bottom-3 right-4 left-4">
            <h3 className="text-white text-lg font-bold drop-shadow-lg">{list.title}</h3>
            <p className="text-white/90 text-sm mt-0.5 drop-shadow line-clamp-1">{list.description}</p>
            <p className="text-white/90 text-xs mt-1">
              ⭐ {list.saves} &nbsp; • &nbsp; {list.itemCount} آیتم
            </p>
          </div>
        </div>
        <div className="p-3 bg-white flex gap-2">
          <Link
            href={`/lists/${list.slug}`}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors text-center"
          >
            ذخیره کن ⭐
          </Link>
          <Link
            href={`/lists/${list.slug}`}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium text-center hover:bg-gray-50 transition-colors"
          >
            مشاهده لیست
          </Link>
        </div>
      </div>
    </div>
  );
}
