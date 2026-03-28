'use client';

import Link from 'next/link';
import { Heart, Package } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

const CARD_GRADIENTS = [
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-sky-400 to-blue-600',
  'from-fuchsia-400 to-purple-600',
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}

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
  variant?: 'grid' | 'compact' | 'featured';
}

export default function ListCardCompact({ list, variant = 'grid' }: ListCardCompactProps) {
  const itemCount = list.itemCount ?? list._count?.items ?? 0;
  const likeCount = list.likeCount ?? list._count?.list_likes ?? 0;
  const gradient = getGradient(list.id);
  const fallbackCategoryIcon = list.categories?.icon ?? '📋';

  if (variant === 'featured') {
    return (
      <Link
        href={`/lists/${list.slug}`}
        className="block bg-white rounded-[20px] overflow-hidden shadow-vibe-card hover:shadow-vibe-card border border-gray-100 active:scale-[0.99] transition-all"
      >
        <div className="relative aspect-[5/2] w-full bg-gray-200 overflow-hidden">
          <ImageWithFallback
            src={list.coverImage ?? ''}
            alt={list.title}
            className="w-full h-full object-cover"
            fallbackIcon={fallbackCategoryIcon}
            fallbackClassName={`w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br ${gradient}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-[18px] leading-[1.3] text-white line-clamp-2 drop-shadow">{list.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-[12px] font-medium text-white/80">
              <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{itemCount} آیتم</span>
              {likeCount > 0 && (
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{likeCount}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

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
            fallbackIcon={fallbackCategoryIcon}
            fallbackClassName={`w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br ${gradient}`}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-[16px] leading-[1.4] text-gray-900 line-clamp-1">{list.title}</h3>
          <div className="flex items-center gap-2.5 mt-1.5 text-[12px] font-medium text-gray-500/75">
            <span className="flex items-center gap-0.5"><Package className="w-3.5 h-3.5" />{itemCount} آیتم</span>
            {likeCount > 0 && (
              <span className="flex items-center gap-0.5"><Heart className="w-3.5 h-3.5" />{likeCount}</span>
            )}
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
      <div className="relative aspect-[2/1] w-full bg-gray-200 overflow-hidden">
        <ImageWithFallback
          src={list.coverImage ?? ''}
          alt={list.title}
          className="w-full h-full object-cover"
          fallbackIcon={fallbackCategoryIcon}
          fallbackClassName={`w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br ${gradient}`}
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-[15px] leading-[1.4] text-gray-900 line-clamp-2">{list.title}</h3>
        <div className="flex items-center gap-2.5 mt-1.5 text-[12px] font-medium text-gray-500/75">
          <span className="flex items-center gap-0.5"><Package className="w-3.5 h-3.5" />{itemCount} آیتم</span>
          {likeCount > 0 && (
            <span className="flex items-center gap-0.5"><Heart className="w-3.5 h-3.5" />{likeCount}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
