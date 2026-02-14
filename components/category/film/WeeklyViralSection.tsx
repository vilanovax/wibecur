'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface WeeklyViralSectionProps {
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

/** لیست‌های وایرال هفته — مرتب بر اساس trend_score_weekly */
export default function WeeklyViralSection({
  lists,
  categoryName,
  accentColor = '#A855F7',
}: WeeklyViralSectionProps) {
  const viralOrHot = lists.filter((l) => l.badge === 'viral' || l.badge === 'hot');
  const displayLists = viralOrHot.length >= 3 ? viralOrHot : lists.slice(0, 6);

  if (displayLists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        🔥 لیست‌های وایرال هفته
      </h2>
      <p className="text-sm text-gray-600 mt-0.5">
        بر اساس trend_score هفتگی در {categoryName}
      </p>

      <div className="flex gap-4 mt-5 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {displayLists.map((list, i) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[72vw] max-w-[300px] snap-start"
          >
            <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-xl active:scale-[0.98] transition-transform">
              <div className="relative aspect-[4/3] bg-gray-800">
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover"
                    placeholderSize="cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-5xl opacity-50"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    🎬
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {(list.badge === 'viral' || list.badge === 'hot' || i < 2) && (
                  <span
                    className={`absolute top-2 right-2 text-white text-xs px-2.5 py-1 rounded-lg font-bold ${
                      list.badge === 'viral' ? 'bg-red-500/95' : 'bg-orange-500/95'
                    }`}
                  >
                    {list.badge === 'viral' ? '🔥 Viral' : '🔥 Hot'}
                  </span>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-bold text-white text-base line-clamp-2 drop-shadow-lg">
                    {list.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-white/90 text-sm">
                    {list.creator?.image && (
                      <ImageWithFallback
                        src={list.creator.image}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-white/50"
                      />
                    )}
                    <span className="truncate">{list.creator?.name || 'کیوریتور'}</span>
                    <span>•</span>
                    <span>⭐ {list.saveCount}</span>
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
