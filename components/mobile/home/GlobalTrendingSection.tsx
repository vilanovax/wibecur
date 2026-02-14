'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { TrendingItem } from '@/types/items';

async function fetchTrending(): Promise<TrendingItem[]> {
  const res = await fetch('/api/items/trending');
  const json = await res.json();
  return json.data && Array.isArray(json.data) ? json.data : [];
}

export default function GlobalTrendingSection() {
  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['items', 'trending'],
    queryFn: fetchTrending,
    staleTime: 5 * 60 * 1000,
  });

  if (loading && items.length === 0) {
    return (
      <section className="px-4 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🔥</span>
          الان وایب روی ایناست
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl aspect-[3/4] bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="px-4 mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
        <span>🔥</span>
        الان وایب روی ایناست
      </h2>
      <p className="text-sm text-gray-500 mb-3">محبوب‌ترین‌های این روزها</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((t, idx) => (
          <Link
            key={t.id}
            href={`/items/${t.id}`}
            className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md active:opacity-95 transition-all"
          >
            <div className="relative aspect-[3/4] w-full bg-gray-100">
              {t.image ? (
                <ImageWithFallback
                  src={t.image}
                  alt={t.title}
                  className="w-full h-full object-cover"
                  fallbackIcon="📋"
                  fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                  placeholderSize="square"
                  priority={idx < 2}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-3xl opacity-50">
                  📋
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                <h3 className="font-semibold text-sm line-clamp-2 drop-shadow">
                  {t.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-white/90">
                  {t.rating != null && (
                    <span className="flex items-center gap-0.5">
                      <span>⭐</span>
                      <span>{t.rating}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <span>👥</span>
                    <span>{t.saveCount}</span>
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
