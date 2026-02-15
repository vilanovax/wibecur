'use client';

import Link from 'next/link';
import type { CuratedCategory } from '@/types/curated';

interface CategoryDiscoverySectionProps {
  categories: CuratedCategory[];
}

export default function CategoryDiscoverySection({
  categories,
}: CategoryDiscoverySectionProps) {
  const displayCats = categories.filter((c) => c.id !== 'all').slice(0, 6);

  if (displayCats.length === 0) return null;

  return (
    <section
      id="categories"
      className="px-4 py-8"
      aria-labelledby="categories-title"
    >
      <h2
        id="categories-title"
        className="text-[18px] font-bold text-gray-900 mb-4"
      >
        کشف دسته‌ها
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {displayCats.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug ?? cat.id}`}
            className="flex flex-col items-center justify-center p-4 rounded-[18px] bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all aspect-square"
          >
            <span className="text-3xl mb-2" aria-hidden>
              {cat.icon}
            </span>
            <span className="text-[14px] font-medium text-gray-900 text-center line-clamp-1">
              {cat.title}
            </span>
          </Link>
        ))}
      </div>
      <Link
        href="/lists"
        className="block mt-4 text-center py-3 rounded-[18px] bg-gray-100 text-gray-700 font-medium text-[14px] hover:bg-gray-200 transition-colors"
      >
        مشاهده همه دسته‌ها
      </Link>
    </section>
  );
}
