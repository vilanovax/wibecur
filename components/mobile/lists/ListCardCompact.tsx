'use client';

import Link from 'next/link';
import { Heart, Star, Package } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

type ListWithCreator = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  saveCount: number;
  likeCount: number;
  itemCount: number;
  categories?: { name: string; icon: string | null } | null;
  users?: { name: string | null; username: string | null; image: string | null } | null;
  _count?: { items: number; list_likes: number };
};

interface ListCardCompactProps {
  list: ListWithCreator;
  variant?: 'grid' | 'compact';
}

export default function ListCardCompact({ list, variant = 'grid' }: ListCardCompactProps) {
  const itemCount = list.itemCount ?? list._count?.items ?? 0;
  const saveCount = list.saveCount ?? 0;
  const likeCount = list.likeCount ?? list._count?.list_likes ?? 0;

  if (variant === 'compact') {
    return (
      <Link
        href={`/lists/${list.slug}`}
        className="flex flex-row-reverse gap-3 p-3 bg-white rounded-[20px] border border-gray-100 shadow-vibe-card hover:shadow-vibe-card active:scale-[0.99] transition-all"
      >
        <div className="relative w-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200 aspect-[4/3]">
          <ImageWithFallback
            src={list.coverImage ?? ''}
            alt={list.title}
            className="w-full h-full object-cover"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="w-full h-full flex items-center justify-center text-2xl"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-[16px] leading-[1.4] text-gray-900 line-clamp-1">{list.title}</h3>
          {list.description && (
            <p className="text-[13px] text-gray-500/80 line-clamp-1 mt-0.5">{list.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-[13px] font-medium text-gray-500/75">
            <span className="flex items-center gap-0.5"><Star className="w-3.5 h-3.5" />{saveCount}</span>
            <span className="flex items-center gap-0.5"><Heart className="w-3.5 h-3.5" />{likeCount}</span>
            <span className="flex items-center gap-0.5"><Package className="w-3.5 h-3.5" />{itemCount} آیتم</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="block bg-white rounded-[20px] overflow-hidden shadow-vibe-card hover:shadow-vibe-card border border-gray-100 active:scale-[0.99] transition-all"
    >
      <div className="relative aspect-[4/3] w-full bg-gray-200 overflow-hidden">
        <ImageWithFallback
          src={list.coverImage ?? ''}
          alt={list.title}
          className="w-full h-full object-cover"
          fallbackIcon={list.categories?.icon ?? '📋'}
          fallbackClassName="w-full h-full flex items-center justify-center text-4xl"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[16px] leading-[1.4] text-gray-900 line-clamp-2">{list.title}</h3>
        {list.description && (
          <p className="text-[13px] text-gray-500/80 line-clamp-1 mt-1 leading-[1.6]">{list.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-[13px] font-medium text-gray-500/75">
          <span className="flex items-center gap-0.5"><Star className="w-3.5 h-3.5" />{saveCount}</span>
          <span className="flex items-center gap-0.5"><Heart className="w-3.5 h-3.5" />{likeCount}</span>
          <span className="flex items-center gap-0.5"><Package className="w-3.5 h-3.5" />{itemCount} آیتم</span>
        </div>
      </div>
    </Link>
  );
}
