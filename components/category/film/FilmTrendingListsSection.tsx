'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface FilmTrendingListsSectionProps {
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

/** داغ‌ترین لیست‌های هفته — تم سینمایی */
export default function FilmTrendingListsSection({
  lists,
  categoryName,
  accentColor = '#A855F7',
}: FilmTrendingListsSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        🔥 داغ‌ترین لیست‌های هفته در {categoryName}
      </h2>
      <p className="text-sm text-gray-600 mt-0.5 mb-5">
        بر اساس ذخیره و engagement
      </p>

      <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide snap-x -mx-4 px-4">
        {lists.map((list, i) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[150px] snap-start"
          >
            <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg active:scale-[0.97] transition-transform">
              <div className="relative aspect-[3/4] bg-gray-800">
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                {(list.badge === 'viral' || list.badge === 'hot' || i < 3) && (
                  <span
                    className={`absolute top-2 right-2 text-white text-[10px] px-2 py-0.5 rounded font-bold ${
                      list.badge === 'viral' ? 'bg-red-500/90' : 'bg-orange-500/90'
                    }`}
                  >
                    {list.badge === 'viral' ? 'Viral' : 'Hot'}
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="font-semibold text-gray-100 text-sm line-clamp-2">
                  {list.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                  {list.creator?.image && (
                    <ImageWithFallback
                      src={list.creator.image}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                  width={16}
                  height={16}
                />
                  )}
                  <span className="truncate">{list.creator?.name || 'کیوریتور'}</span>
                  <span>•</span>
                  <span>⭐ {list.saveCount}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
