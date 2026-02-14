'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface CategoryListCardImprovedProps {
  list: CategoryListCard;
  accentColor?: string;
}

export default function CategoryListCardImproved({
  list,
  accentColor = '#8B5CF6',
}: CategoryListCardImprovedProps) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      className="flex gap-4 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors active:scale-[0.99]"
    >
      <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
        {list.coverImage ? (
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            📋
          </div>
        )}
        {list.badge && (
          <span className="absolute top-1 right-1 text-white text-[10px] px-1.5 py-0.5 rounded bg-orange-500">
            {list.badge === 'viral' ? '🔥' : list.badge === 'hot' ? '🔥' : 'ترند'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {list.creator?.image ? (
            <ImageWithFallback
              src={list.creator.image}
              alt={list.creator.name || ''}
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px] flex-shrink-0">
              {(list.creator?.name || '?')[0]}
            </div>
          )}
          <span className="text-xs text-gray-500 truncate">
            {list.creator?.name || 'کاربر'}
          </span>
          {list.cityTag && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              📍 {list.cityTag}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
          {list.title}
        </h3>
        <p className="text-sm font-bold text-primary mt-0.5">
          ⭐ {list.saveCount} ذخیره
        </p>
      </div>
    </Link>
  );
}
