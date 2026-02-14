'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface HubNewListsProps {
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

/** لیست‌های جدید — چیدمان عمودی compact */
export default function HubNewLists({
  lists,
  categoryName,
  accentColor = '#EA580C',
}: HubNewListsProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        🆕 لیست‌های جدید
      </h2>
      <p className="text-[11px] text-gray-500">
        تازه‌ترین لیست‌های {categoryName}
      </p>

      <div className="space-y-1 mt-2">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-2.5 p-2 rounded-xl bg-white border border-gray-100 shadow-md active:scale-[0.99] transition-transform"
          >
            <div className="min-w-0 flex-1 text-start">
              <h3 className="font-semibold text-gray-900 text-xs line-clamp-2">
                {list.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-gray-400">
                <span>{list.creator?.name || 'کیوریتور'}</span>
                <span>•</span>
                <span>{list.itemCount} آیتم</span>
                <span>•</span>
                <span>⭐ {list.saveCount}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden order-first">
              {list.coverImage ? (
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  placeholderSize="square"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-base opacity-40"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  📋
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
