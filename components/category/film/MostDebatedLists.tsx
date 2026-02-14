'use client';

import Link from 'next/link';
import type { CategoryListCard } from '@/types/category-page';

interface MostDebatedListsProps {
  lists: CategoryListCard[];
}

/** لیست‌های با بیشترین نظر و گفتگو */
export default function MostDebatedLists({ lists }: MostDebatedListsProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        💬 پربحث‌ترین لیست‌ها
      </h2>
      <p className="text-sm text-gray-600 mt-0.5 mb-5">
        بیشترین گفتگو در ۷ روز گذشته
      </p>

      <div className="space-y-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base line-clamp-2">
                {list.title}
              </h3>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  💬 {list.commentCount ?? 0} نظر
                </span>
                <span className="flex items-center gap-1">
                  🔥 {list.likeCount} واکنش
                </span>
                <span className="flex items-center gap-1">
                  ❤️ {list.saveCount} ذخیره
                </span>
              </div>
            </div>
            <span className="text-gray-500">←</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
