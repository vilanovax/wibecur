'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface TrendingNowSectionProps {
  lists: CategoryListCard[];
  accentColor?: string;
}

export default function TrendingNowSection({
  lists,
  accentColor = '#EA580C',
}: TrendingNowSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span className="animate-pulse">🔥</span>
        داغ‌ترین‌های امروز
      </h2>
      <p className="text-sm text-gray-500 mt-0.5">
        بر اساس ذخیره در ۲۴ ساعت گذشته
      </p>
      <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[75vw] max-w-[280px] snap-start"
          >
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
              <div className="relative aspect-[4/3] bg-gray-100">
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-4xl opacity-40"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    📋
                  </div>
                )}
                <span
                  className="absolute top-2 right-2 flex items-center gap-1 text-white text-xs px-2.5 py-1 rounded-lg font-semibold bg-orange-500/95 shadow"
                  style={{ animation: 'pulse 2s infinite' }}
                >
                  🔥 {list.saves24h ?? 0} ذخیره امروز
                </span>
                {list.cityTag && (
                  <span className="absolute bottom-2 right-2 text-white/95 text-xs px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
                    📍 {list.cityTag}
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  {list.creator?.image ? (
                    <ImageWithFallback
                      src={list.creator.image}
                      alt={list.creator.name || ''}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs flex-shrink-0">
                      {(list.creator?.name || '?')[0]}
                    </div>
                  )}
                  <span className="text-xs text-gray-500 truncate">
                    {list.creator?.name || 'کاربر'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                  {list.title}
                </h3>
                <p className="text-sm font-bold text-primary mt-1.5">
                  ⭐ {list.saveCount} ذخیره
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
