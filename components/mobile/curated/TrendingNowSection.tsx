'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { CuratedList } from '@/types/curated';

interface TrendingNowSectionProps {
  lists: CuratedList[];
}

export default function TrendingNowSection({ lists }: TrendingNowSectionProps) {
  const trending = lists
    .sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0))
    .slice(0, 10);

  if (trending.length === 0) return null;

  return (
    <section
      id="trending"
      className="px-4 pt-6 pb-1"
      aria-labelledby="trending-title"
    >
      <h2
        id="trending-title"
        className="text-[18px] font-bold text-gray-900 mb-3 flex items-center gap-2"
      >
        <span aria-hidden>🔥</span>
        داغ‌ترین لیست‌های امروز
      </h2>
      <p className="text-[13px] text-gray-500 mb-4">
        بر اساس تعامل هفتگی
      </p>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {trending.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[200px] snap-start group"
          >
            <div className="rounded-[18px] overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <div className="relative aspect-[4/3] bg-gray-200">
                <ImageWithFallback
                  src={list.coverUrl ?? ''}
                  alt={list.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  fallbackIcon="📋"
                  fallbackClassName="w-full h-full flex items-center justify-center text-2xl"
                />
                {list.badges.includes('trending') && (
                  <span
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500 text-white shadow-sm"
                  >
                    🔥 ترند
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-[16px] text-gray-900 line-clamp-2 leading-snug">
                  {list.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-[12px] text-gray-500">
                  <span className="flex items-center gap-0.5">
                    ❤️ {formatNumber(list.savesCount)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    📦 {list.itemsCount} آیتم
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
