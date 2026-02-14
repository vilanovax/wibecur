'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface CafeWeeklyTrendingProps {
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

export default function CafeWeeklyTrending({
  lists,
  categoryName,
  accentColor = '#EA580C',
}: CafeWeeklyTrendingProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        <span className="inline-block animate-pulse" style={{ animationDuration: '1.5s' }}>🔥</span>
        داغ‌ترین لیست‌های هفته در {categoryName}
      </h2>
      <p className="text-sm text-gray-600 mb-4">بر اساس ذخیره و engagement</p>
      <div className="grid grid-cols-2 gap-4">
        {lists.slice(0, 6).map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="block rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="relative aspect-[3/4] bg-gray-100">
              {list.coverImage ? (
                <ImageWithFallback src={list.coverImage} alt={list.title} className="w-full h-full object-cover" placeholderSize="cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-40" style={{ backgroundColor: `${accentColor}20` }}>☕</div>
              )}
              <span className="absolute top-2 right-2 flex items-center gap-1 text-white text-xs px-2.5 py-1 rounded-lg font-bold shadow-lg" style={{ background: `linear-gradient(135deg, ${accentColor}, #dc2626)` }}>
                Trending 🔥
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <h3 className="font-bold text-white text-sm line-clamp-2 drop-shadow">{list.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-white/90 text-xs">
                  <span>❤️ {list.likeCount}</span>
                  <span>⭐ {list.saveCount}</span>
                </div>
                {list.creator?.name && <p className="text-white/80 text-[10px] mt-1 truncate">{list.creator.name}</p>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
