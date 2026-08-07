'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface FilmTrendingNowCarouselProps {
  lists: CategoryListCard[];
  accentColor?: string;
}

/** کاروسل داغ‌ترین‌های ۲۴ ساعته — پوسترمحور، badge شعله متحرک */
export default function FilmTrendingNowCarousel({
  lists,
  accentColor = '#A855F7',
}: FilmTrendingNowCarouselProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span className="inline-block animate-pulse">🔥</span>
        داغ‌ترین‌های امروز
      </h2>
      <p className="text-sm text-gray-600 mt-0.5">
        بر اساس ذخیره در ۲۴ ساعت گذشته
      </p>

      <div className="flex gap-5 mt-5 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[140px] snap-start group"
          >
            <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-xl active:scale-[0.97] transition-transform">
              <div className="relative aspect-[3/4] bg-gray-800">
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    placeholderSize="square"
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-5xl opacity-50"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    🎬
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"
                  aria-hidden
                />
                <span
                  className="absolute top-2 right-2 flex items-center gap-1 text-white text-xs px-2 py-1 rounded-lg font-bold bg-orange-500 shadow-lg animate-pulse"
                  style={{ animationDuration: '1.5s' }}
                >
                  🔥 {list.saves24h ?? 0}
                </span>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center gap-1.5 text-white/90 text-xs">
                    <span>❤️ {list.likeCount}</span>
                    <span>•</span>
                    <span>⭐ {list.saveCount}</span>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  {list.creator?.image ? (
                    <ImageWithFallback
                      src={list.creator.image}
                      alt={list.creator.name || ''}
                      className="w-5 h-5 rounded-full object-cover flex-shrink-0 ring-1 ring-white/30"
                  width={20}
                  height={20}
                />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px] text-white flex-shrink-0">
                      {(list.creator?.name || '?')[0]}
                    </div>
                  )}
                  <span className="text-[11px] text-gray-400 truncate">
                    {list.creator?.name || 'کیوریتور'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-100 text-sm line-clamp-2 leading-tight">
                  {list.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
