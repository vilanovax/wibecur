'use client';

import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import { PLACEHOLDER_COVER_SMALL } from '@/lib/placeholder-images';

export default function TrendingThisWeekCarousel() {
  const { data, isLoading } = useHomeData();
  const lists = (data?.trending ?? []).slice(0, 6).map((l) => ({
    ...l,
    coverImage: l.coverImage || PLACEHOLDER_COVER_SMALL,
  }));

  if (isLoading && lists.length === 0) {
    return (
      <section className="mb-6">
        <div className="px-4 mb-3">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-56 mt-1 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 px-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[140px] h-[187px] rounded-[18px] bg-gray-100 animate-pulse" />
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
          <span>🔥</span>
          ترند این هفته
        </h2>
        <p className="text-[13px] text-gray-500/80 leading-[1.6] mt-0.5">بر اساس رشد ذخیره و تعامل</p>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory -mx-1">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[140px] snap-start"
          >
            <div className="rounded-[18px] overflow-hidden bg-white border border-gray-100 shadow-vibe-card w-[140px] h-[187px]">
              <div className="relative h-full w-full bg-gray-100">
                <span className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  ترند
                </span>
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  fallbackIcon="📋"
                  fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-semibold text-white text-[15px] leading-[1.4] line-clamp-2 drop-shadow">{list.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-[12px] font-medium text-white/75">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5" />
                      {list.saveCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-3.5 h-3.5" />
                      {list.likes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
