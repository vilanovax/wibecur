'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface HubTrendingNowProps {
  lists: CategoryListCard[];
  accentColor?: string;
}

/** کاروسل داغ‌ترین‌های ۲۴ ساعت — 3.5 کارت، badge با انیمیشن pulse */
export default function HubTrendingNow({
  lists,
  accentColor = '#EA580C',
}: HubTrendingNowProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        <span
          className="inline-block animate-pulse"
          style={{ animationDuration: '1.5s' }}
        >
          🔥
        </span>
        داغ‌ترین لیست‌های امروز
      </h2>
      <p className="text-[11px] text-gray-500">
        بر اساس رشد ذخیره در ۲۴ ساعت گذشته
      </p>

      <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {lists.map((list) => {
          const growth = list.saves24h ?? 0;
          return (
            <Link
              key={list.id}
              href={`/lists/${list.slug}`}
              className="flex-shrink-0 w-[68vw] max-w-[240px] snap-start"
            >
              <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-lg active:scale-[0.98] transition-transform">
                <div className="relative aspect-[3/4] bg-gray-100">
                  {list.coverImage ? (
                    <ImageWithFallback
                      src={list.coverImage}
                      alt={list.title}
                      className="w-full h-full object-cover"
                      placeholderSize="cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-4xl opacity-40"
                      style={{ backgroundColor: `${accentColor}20` }}
                    >
                      📋
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    <span
                      className="flex items-center gap-0.5 text-white text-[11px] px-2 py-0.5 rounded-lg font-bold shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                        animation: 'pulse 2s ease-in-out infinite',
                      }}
                    >
                      🔥 {growth}
                    </span>
                    {growth > 0 && (
                      <span className="flex items-center gap-0.5 text-white text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-emerald-500/95 shadow">
                        ↑ +{growth}
                      </span>
                    )}
                  </div>
                  {list.cityTag && (
                    <span className="absolute bottom-2 right-2 text-white/95 text-[10px] px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
                      📍 {list.cityTag}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                    {list.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {list.creator?.image && (
                      <ImageWithFallback
                        src={list.creator.image}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    <span className="text-[10px] text-gray-500 truncate flex-1">
                      {list.creator?.name || 'کیوریتور'}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: accentColor }}>
                      ⭐ {list.saveCount}
                    </span>
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
