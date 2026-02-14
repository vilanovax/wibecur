'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import { PLACEHOLDER_COVER_SMALL } from '@/lib/placeholder-images';

export default function NewAndRisingSection() {
  const { data, isLoading } = useHomeData();
  const lists = (data?.rising ?? []).slice(0, 6).map((l) => ({
    ...l,
    coverImage: l.coverImage || PLACEHOLDER_COVER_SMALL,
  }));

  if (isLoading && lists.length === 0) {
    return (
      <section className="mb-6">
        <div className="px-4 mb-3">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl h-20 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="px-4 mb-3">
        <h2 className="text-[18px] font-semibold leading-[1.4] text-gray-900 flex items-center gap-2">
          <span>🆕</span>
          New & Rising
        </h2>
        <p className="text-[13px] text-gray-500/80 leading-[1.6] mt-0.5">📈 لیست‌های در حال رشد</p>
      </div>
      <div className="px-4 space-y-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex flex-row-reverse gap-4 rounded-[18px] overflow-hidden bg-white border border-gray-100 shadow-vibe-card hover:shadow-vibe-card active:scale-[0.99] transition-all p-4"
          >
            <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
              <ImageWithFallback
                src={list.coverImage}
                alt={list.title}
                className="w-full h-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
              />
              {(list as { isFastRising?: boolean }).isFastRising && (
                <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  در حال رشد
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-semibold text-[15px] leading-[1.4] text-gray-900 line-clamp-2">{list.title}</h3>
              <div className="flex items-center gap-2 mt-1 text-[12px] font-medium text-gray-500/75">
                <span>⭐ {list.saveCount}</span>
                <span>·</span>
                <span>{list.itemCount} آیتم</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
