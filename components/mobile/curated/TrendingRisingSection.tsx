'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { CuratedList } from '@/types/curated';

interface TrendingRisingSectionProps {
  trendingLists: CuratedList[];
  risingLists: CuratedList[];
}

type Tab = 'trending' | 'rising';

export default function TrendingRisingSection({
  trendingLists,
  risingLists,
}: TrendingRisingSectionProps) {
  const trending = trendingLists
    .sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0))
    .slice(0, 10);

  const rising = risingLists
    .sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0))
    .slice(0, 10);

  const hasRising = rising.length >= 2;
  const [activeTab, setActiveTab] = useState<Tab>('trending');

  if (trending.length === 0 && rising.length === 0) return null;

  // اگه rising کم‌تر از ۲ آیتم داره، فقط trending نمایش بده بدون تب
  const showTabs = hasRising && trending.length > 0;
  const activeLists = activeTab === 'trending' ? trending : rising;

  return (
    <section
      id="trending"
      className="px-4 pt-6 pb-4"
      aria-labelledby="trending-rising-title"
    >
      {showTabs ? (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                activeTab === 'trending'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              پرطرفدارترین‌ها
            </button>
            <button
              onClick={() => setActiveTab('rising')}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1 ${
                activeTab === 'rising'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              در حال رشد
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2
            id="trending-rising-title"
            className="text-[18px] font-bold text-gray-900 mb-3 flex items-center gap-2"
          >
            <span aria-hidden>⭐</span>
            پرطرفدارترین‌ها
          </h2>
          <p className="text-[13px] text-gray-500 mb-4">
            بیشترین تعامل در هفته اخیر
          </p>
        </>
      )}

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {activeLists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[200px] snap-start group"
          >
            <div className="rounded-[18px] overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <div className="relative aspect-[2/1] bg-gray-200">
                <ImageWithFallback
                  src={list.coverUrl ?? ''}
                  alt={list.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  fallbackColorSeed={list.id}
                />
                {activeTab === 'trending' && list.badges.includes('trending') && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500 text-white shadow-sm">
                    🔥 ترند
                  </span>
                )}
                {activeTab === 'rising' && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500 text-white shadow-sm flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    رشد سریع
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
