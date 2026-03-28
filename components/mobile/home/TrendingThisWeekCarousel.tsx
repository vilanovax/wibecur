'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import { PLACEHOLDER_COVER_SMALL } from '@/lib/placeholder-images';

const CARD_GRADIENTS = [
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-sky-400 to-blue-600',
  'from-fuchsia-400 to-purple-600',
];

export default function TrendingThisWeekCarousel() {
  const { data, isLoading } = useHomeData();
  const lists = (data?.trending ?? []).slice(0, 6).map((l) => ({
    ...l,
    coverImage: l.coverImage || PLACEHOLDER_COVER_SMALL,
  }));

  if (isLoading && lists.length === 0) {
    return (
      <section>
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
    <section>
      <div className="px-4 mb-3">
        <h2 className="text-[18px] font-semibold leading-[1.4] text-gray-900 flex items-center gap-2">
          <span>🔥</span>
          ترند این هفته
        </h2>
        <p className="text-[13px] text-gray-500/80 leading-[1.6] mt-0.5">بر اساس رشد ذخیره و تعامل</p>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory -mx-1">
        {lists.map((list, idx) => {
          const growthPercent = [24, 18, 12, 8, 6, 4][idx] ?? 0;
          return (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[140px] snap-start"
          >
            <div className="rounded-[18px] overflow-hidden bg-white border border-gray-100 shadow-vibe-card w-[140px] h-[187px]">
              <div className="relative h-full w-full bg-gray-100">
                {growthPercent > 0 && (
                  <span className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    +{growthPercent}%
                  </span>
                )}
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  fallbackIcon="📋"
                  fallbackClassName={`w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br ${CARD_GRADIENTS[idx % CARD_GRADIENTS.length]}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-semibold text-white text-[15px] leading-[1.4] line-clamp-2 drop-shadow">{list.title}</h3>
                  <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-white/75">
                    <Heart className="w-3 h-3" />
                    {list.likes.toLocaleString('fa-IR')}
                  </div>
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
