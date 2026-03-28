'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { CuratedList } from '@/types/curated';

interface RisingListsSectionProps {
  lists: CuratedList[];
}

export default function RisingListsSection({ lists }: RisingListsSectionProps) {
  const rising = lists
    .sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0))
    .slice(0, 6);

  if (rising.length === 0) return null;

  return (
    <section
      id="rising"
      className="px-4 pt-2 pb-8 bg-gradient-to-b from-purple-50/50 to-transparent rounded-t-[24px]"
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
      <div className="space-y-3">
        {rising.map((list, idx) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex flex-row-reverse gap-3 rounded-[18px] overflow-hidden bg-white border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 active:scale-[0.99] transition-all p-3"
          >
            <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
              <ImageWithFallback
                src={list.coverUrl ?? ''}
                alt={list.title}
                className="w-full h-full object-cover"
                fallbackColorSeed={list.id}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-semibold text-[15px] leading-[1.4] text-gray-900 line-clamp-1">{list.title}</h3>
              <div className="flex items-center gap-2 mt-1 text-[12px] font-medium text-gray-500/75">
                <span>{list.itemsCount} آیتم</span>
                {list.likesCount > 0 && (
                  <>
                    <span>·</span>
                    <span>❤️ {formatNumber(list.likesCount)}</span>
                  </>
                )}
                <span className="flex items-center gap-0.5 text-purple-600">
                  <TrendingUp className="w-3 h-3" />
                  رشد سریع
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center w-8">
              <span className="text-[20px] font-bold text-purple-200">{(idx + 1).toLocaleString('fa-IR')}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
