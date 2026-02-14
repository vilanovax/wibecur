'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryItemCard } from '@/types/category-page';

interface MostSavedItemsCafeProps {
  items: CategoryItemCard[];
  accentColor?: string;
}

/** محبوب‌ترین آیتم‌ها — Micro Explore Layer */
export default function MostSavedItemsCafe({
  items,
  accentColor = '#EA580C',
}: MostSavedItemsCafeProps) {
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
        ⭐ محبوب‌ترین آیتم‌ها
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        از لیست‌های پربار
      </p>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/lists/${item.listSlug}#item-${item.id}`}
            className="flex-shrink-0 w-24"
          >
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-md active:scale-[0.97] transition-transform aspect-square">
              {item.imageUrl ? (
                <ImageWithFallback
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  placeholderSize="square"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl opacity-40"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  ☕
                </div>
              )}
            </div>
            <p className="text-xs font-medium text-gray-900 mt-1.5 line-clamp-2 leading-tight">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
