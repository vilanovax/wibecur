'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface HubTrendingNowV2Props {
  lists: CategoryListCard[];
  accentColor?: string;
}

/** کاروسل Trending V2 — badge با growth %، bottom overlay، pulse on viewport */
export default function HubTrendingNowV2({
  lists,
  accentColor = '#EA580C',
}: HubTrendingNowV2Props) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        <span className="inline-block animate-pulse" style={{ animationDuration: '1.5s' }}>
          🔥
        </span>
        داغ‌ترین لیست‌های ۲۴ ساعت اخیر
      </h2>
      <p className="text-[11px] text-gray-500">
        بر اساس رشد سریع ذخیره و تعامل
      </p>

      <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {lists.map((list) => (
          <TrendingCard
            key={list.id}
            list={list}
            accentColor={accentColor}
          />
        ))}
      </div>
    </section>
  );
}

function TrendingCard({
  list,
  accentColor,
}: {
  list: CategoryListCard;
  accentColor: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const growth = list.growthPercent ?? (list.saves24h && list.saves24h > 0 ? 12 : 0);

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="flex-shrink-0 w-[70vw] max-w-[260px] snap-start"
    >
      <div ref={ref} className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-xl active:scale-[0.98] transition-transform">
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

          {growth > 0 && (
            <span
              className={`absolute top-2 right-2 flex items-center gap-0.5 text-white text-[11px] px-2 py-1 rounded-lg font-bold shadow-lg transition-transform ${
                inView ? 'animate-pulse' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                animationDuration: '2s',
              }}
            >
              🔥 +{growth}%
            </span>
          )}

          {/* Bottom overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <h3 className="font-bold text-white text-sm line-clamp-1 drop-shadow">
              {list.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-white/90 text-[11px]">
              <span>❤️ {list.likeCount}</span>
              <span>⭐ {list.saveCount}</span>
              {list.creator?.username && (
                <Link
                  href={`/u/${list.creator.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 truncate hover:underline"
                >
                  {list.creator?.image && (
                    <ImageWithFallback
                      src={list.creator.image}
                      alt=""
                      className="w-3.5 h-3.5 rounded-full object-cover"
                    />
                  )}
                  <span className="truncate">👤 {list.creator?.name || 'کیوریتور'}</span>
                </Link>
              )}
              {!list.creator?.username && (
                <span>👤 {list.creator?.name || 'کیوریتور'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
