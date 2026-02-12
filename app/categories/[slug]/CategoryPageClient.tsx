'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface TrendingItem {
  id: string;
  title: string;
  image: string | null;
  rating: number | null;
  saveCount: number;
  trendScore: number;
}

interface CategoryPageClientProps {
  slug: string;
  categoryName: string;
}

export default function CategoryPageClient({
  slug,
  categoryName,
}: CategoryPageClientProps) {
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/categories/${slug}/trending`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) setTrending(json.data);
      })
      .catch(() => setTrending([]))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <main className="px-4 py-6 space-y-6">
      {/* Trending section at top */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span>🔥</span>
          داغ‌های این روزای {categoryName}
        </h2>
        <p className="text-sm text-gray-500 mb-3">محبوب‌ترین‌های اخیر همین ژانر</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-xl bg-gray-100 animate-pulse h-20"
              />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <div className="py-8 px-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">هنوز داغی در این دسته نداریم</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trending.map((t, index) => {
              const rank = index + 1;
              const isTop = rank === 1;
              return (
                <Link
                  key={t.id}
                  href={`/items/${t.id}`}
                  className={`relative flex gap-3 p-3 rounded-xl bg-white border transition-all active:opacity-95 overflow-hidden ${
                    isTop
                      ? 'border-orange-200 shadow-md shadow-orange-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span
                    className={`absolute right-2 top-1/2 -translate-y-1/2 font-black tabular-nums select-none pointer-events-none ${
                      isTop ? 'text-6xl text-orange-100' : 'text-5xl text-gray-100'
                    }`}
                    style={{ lineHeight: 1 }}
                    aria-hidden
                  >
                    {rank}
                  </span>
                  <div
                    className={`relative z-10 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 ${
                      isTop ? 'w-[88px] h-[88px]' : 'w-[80px] h-[80px]'
                    }`}
                  >
                    {t.image ? (
                      <ImageWithFallback
                        src={t.image}
                        alt={t.title}
                        className="w-full h-full object-cover"
                        fallbackIcon="📋"
                        fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-2xl opacity-50">
                        📋
                      </div>
                    )}
                    {rank <= 3 && (
                      <span className="absolute top-1 right-1 text-xs bg-orange-500/90 text-white px-1.5 py-0.5 rounded-md">
                        🔥
                      </span>
                    )}
                  </div>
                  <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isTop ? 'text-orange-500' : 'text-gray-400'
                      }`}
                    >
                      #{rank}
                      {rank <= 3 && ' 🔥'}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mt-0.5">
                      {t.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {t.rating != null && (
                        <span className="flex items-center gap-0.5">
                          <span>⭐</span>
                          <span>{t.rating}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <span>👥</span>
                        <span>{t.saveCount} ذخیره</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
