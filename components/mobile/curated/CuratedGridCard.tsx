'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { CuratedList } from '@/types/curated';
import { Star, Heart, Package } from 'lucide-react';

const BADGE_STYLES: Record<string, string> = {
  trending: 'bg-orange-100 text-orange-800',
  rising: 'bg-purple-100 text-purple-800',
  featured: 'bg-amber-100 text-amber-800',
  ai: 'bg-blue-100 text-blue-800',
};

const BADGE_LABELS: Record<string, string> = {
  trending: 'ترند',
  rising: 'در حال رشد',
  featured: 'ویژه',
  ai: 'AI',
};

interface CuratedGridCardProps {
  list: CuratedList;
}

export default function CuratedGridCard({ list }: CuratedGridCardProps) {
  const topBadge = list.badges[0];

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="block bg-white rounded-[18px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div className="relative aspect-[4/3] w-full bg-gray-200 overflow-hidden">
        <ImageWithFallback
          src={list.coverUrl ?? ''}
          alt={list.title}
          className="w-full h-full object-cover"
          fallbackIcon="📋"
          fallbackClassName="w-full h-full flex items-center justify-center text-3xl"
        />
        {topBadge && (
          <span
            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-medium ${BADGE_STYLES[topBadge] ?? 'bg-gray-800 text-white'}`}
          >
            {BADGE_LABELS[topBadge] ?? topBadge}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[11px] text-gray-500 mb-1">{list.creator.levelTitle}</p>
        <h3 className="font-semibold text-[14px] leading-snug text-gray-900 line-clamp-2">
          {list.title}
        </h3>
        {list.subtitle && (
          <p className="text-[12px] text-gray-500 line-clamp-1 mt-0.5">
            {list.subtitle}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-[12px] text-gray-500">
          <span className="flex items-center gap-0.5">
            <Package className="w-3.5 h-3.5" />
            {list.itemsCount}
          </span>
          <span className="flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5" />
            {formatNumber(list.savesCount)}
          </span>
          <span className="flex items-center gap-0.5">
            <Heart className="w-3.5 h-3.5" />
            {formatNumber(list.likesCount)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            <ImageWithFallback
              src={list.creator.avatarUrl ?? ''}
              alt={list.creator.name}
              className="w-full h-full object-cover"
              fallbackIcon="👤"
              fallbackClassName="w-full h-full flex items-center justify-center text-xs"
            />
          </div>
          <span className="text-[12px] font-medium text-gray-700 truncate">
            {list.creator.name}
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="flex-1 inline-flex justify-center py-2 rounded-xl bg-primary text-white text-[12px] font-medium">
            مشاهده
          </span>
          <span className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-[12px]">
            ذخیره
          </span>
        </div>
      </div>
    </Link>
  );
}
