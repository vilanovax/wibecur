'use client';

import Link from 'next/link';
import CategorySectionTitle from '../CategorySectionTitle';
import type { CategoryListCard } from '@/types/category-page';
import { FILM_SECTION } from './film-layout';

interface MostDebatedListsProps {
  lists: CategoryListCard[];
}

/** لیست‌های با بیشترین نظر و گفتگو */
export default function MostDebatedLists({ lists }: MostDebatedListsProps) {
  if (lists.length === 0) return null;

  return (
    <section className={FILM_SECTION}>
      <CategorySectionTitle
        title="پربحث‌ترین لیست‌ها"
        subtitle="بیشترین گفتگو در ۷ روز گذشته"
        icon="💬"
      />

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-sm active:scale-[0.99] transition-all lg:rounded-2xl lg:hover:border-primary/20 lg:hover:shadow-md"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base line-clamp-2 lg:text-[15px]">
                {list.title}
              </h3>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 lg:gap-4">
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
            <span className="text-gray-400 lg:text-gray-500 shrink-0">←</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
