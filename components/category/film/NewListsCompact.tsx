'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface NewListsCompactProps {
  lists: CategoryListCard[];
  categoryName: string;
}

/** لیست‌های جدید — کارت compact */
export default function NewListsCompact({
  lists,
  categoryName,
}: NewListsCompactProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        🆕 لیست‌های جدید و تازه
      </h2>
      <p className="text-sm text-gray-600 mt-0.5 mb-5">
        تازه‌ترین لیست‌های {categoryName}
      </p>

      <div className="space-y-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-4 p-3 rounded-xl bg-white border border-gray-200 shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="w-14 h-20 rounded-lg bg-gray-700 flex-shrink-0 overflow-hidden">
              {list.coverImage ? (
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  placeholderSize="square"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">
                  🎬
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                {list.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                By {list.creator?.name || 'کیوریتور'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {list.itemCount} آیتم
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
