'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { CuratedList } from '@/types/curated';

interface RisingListsSectionProps {
  lists: CuratedList[];
}

export default function RisingListsSection({ lists }: RisingListsSectionProps) {
  const rising = lists
    .filter((l) => l.badges.includes('rising') || (l.weeklyVelocity ?? 0) > 100)
    .sort((a, b) => (b.weeklyVelocity ?? 0) - (a.weeklyVelocity ?? 0))
    .slice(0, 6);

  if (rising.length === 0) return null;

  return (
    <section
      id="rising"
      className="px-4 py-8 bg-gradient-to-b from-purple-50/50 to-transparent rounded-t-[24px] -mt-4"
      aria-labelledby="rising-title"
    >
      <h2
        id="rising-title"
        className="text-[18px] font-bold text-gray-900 mb-2 flex items-center gap-2"
      >
        <span aria-hidden>🚀</span>
        در حال اوج گرفتن
      </h2>
      <p className="text-[13px] text-gray-500 mb-4">بر اساس مومنتوم رشد</p>
      <div className="grid grid-cols-2 gap-4">
        {rising.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="block rounded-[18px] overflow-hidden bg-white border-2 border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
          >
            <div className="relative aspect-[4/3] bg-gray-200">
              <ImageWithFallback
                src={list.coverUrl ?? ''}
                alt={list.title}
                className="w-full h-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="w-full h-full flex items-center justify-center text-2xl"
              />
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-800">
                در حال رشد
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-[14px] text-gray-900 line-clamp-2">
                {list.title}
              </h3>
              <p className="text-[12px] text-gray-500 mt-1">
                ❤️ {formatNumber(list.savesCount)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
