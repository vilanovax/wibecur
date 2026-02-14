'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface PopularAllTimeSectionProps {
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

/** محبوب‌ترین لیست‌های تاریخ — بر اساس total saves */
export default function PopularAllTimeSection({
  lists,
  categoryName,
  accentColor = '#A855F7',
}: PopularAllTimeSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        ⭐ محبوب‌ترین لیست‌های تاریخ
      </h2>
      <p className="text-sm text-gray-600 mt-0.5 mb-5">
        بر اساس مجموع ذخیره‌ها در {categoryName}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg active:scale-[0.98] transition-transform"
          >
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
                  className="w-full h-full flex items-center justify-center text-4xl opacity-50"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  🎬
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <span className="absolute bottom-2 right-2 text-white/95 text-xs font-bold bg-black/50 px-2 py-0.5 rounded">
                ⭐ {list.saveCount}
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-gray-100 text-sm line-clamp-2">
                {list.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {list.creator?.name || 'کیوریتور'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
