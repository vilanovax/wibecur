'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface TrendingPosterGridProps {
  lists: CategoryListCard[];
  categoryName: string;
}

/** گرید پوستر عمودی ۲:۳ — Netflix-style */
export default function TrendingPosterGrid({
  lists,
  categoryName,
}: TrendingPosterGridProps) {
  if (lists.length === 0) return null;

  const rating = (s: number, l: number) =>
    l > 0 ? (s / l).toFixed(1) : '0';

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span className="inline-block animate-pulse">🔥</span>
        داغ‌ترین لیست‌های هفته
      </h2>
      <p className="text-sm text-gray-600 mt-0.5">
        بر اساس سرعت engagement
      </p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {lists.slice(0, 6).map((list, i) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="group block"
          >
            <div className="relative rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm active:scale-[0.98] transition-transform">
              <div className="relative aspect-[2/3] bg-gray-800">
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    placeholderSize="square"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl opacity-50 bg-gray-800">
                    🎬
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {(list.growthPercent ?? 0) > 0 && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-white text-xs px-2 py-1 rounded-lg font-bold bg-red-500/95">
                    🔥 +{list.growthPercent ?? 0}%
                  </span>
                )}
                {list.badge === 'viral' && (
                  <span className="absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-lg font-bold bg-red-500/95">
                    Viral
                  </span>
                )}
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="font-bold text-white text-sm line-clamp-2 drop-shadow-lg leading-tight">
                    {list.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-white/90">
                    <span>⭐ {rating(list.likeCount, list.itemCount || 1)}</span>
                    <span>•</span>
                    <span>❤️ {list.saveCount} ذخیره</span>
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
