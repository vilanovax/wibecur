'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface TopSavedThisWeekProps {
  lists: CategoryListCard[];
  accentColor?: string;
}

/** گرید ۲ ستونه — محبوب‌ترین‌های این هفته (ذخیره پایدار) */
export default function TopSavedThisWeek({
  lists,
  accentColor = '#EA580C',
}: TopSavedThisWeekProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-1">
        📈 محبوب‌ترین‌های این هفته
      </h2>
      <p className="text-[11px] text-wibe-secondary">
        بر اساس ذخیره در ۷ روز گذشته — محبوبیت پایدار
      </p>

      <div className="grid grid-cols-2 gap-2.5 mt-2">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="relative aspect-[4/3] bg-gray-100">
              {list.coverImage ? (
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  placeholderSize="cover"
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl opacity-40"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  📋
                </div>
              )}
              <div className="absolute bottom-1 right-1 text-white/95 text-[10px] font-bold bg-black/50 px-1.5 py-0.5 rounded">
                ⭐ {list.saveCount}
              </div>
            </div>
            <div className="p-2.5">
              <h3 className="font-semibold text-foreground text-xs line-clamp-2">
                {list.title}
              </h3>
              <p className="text-[10px] text-wibe-secondary mt-0.5">
                {list.creator?.name || 'کیوریتور'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
