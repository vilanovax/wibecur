'use client';

import Link from 'next/link';
import type { CuratedCategory } from '@/types/curated';

interface CategoryDiscoverySectionProps {
  categories: CuratedCategory[];
}

export default function CategoryDiscoverySection({
  categories,
}: CategoryDiscoverySectionProps) {
  const displayCats = categories.filter((c) => c.id !== 'all');

  if (displayCats.length === 0) return null;

  return (
    <section
      id="categories"
      className="py-6"
      aria-labelledby="categories-title"
    >
      <div className="flex items-center justify-between px-4 mb-4">
        <h2
          id="categories-title"
          className="text-[18px] font-bold text-gray-900"
        >
          کشف دسته‌ها
        </h2>
        <Link
          href="/lists"
          className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
        >
          همه دسته‌ها
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x">
        {displayCats.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug ?? cat.id}`}
            className="flex-shrink-0 flex flex-col items-center justify-center w-[100px] h-[100px] rounded-[18px] bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 active:scale-[0.97] transition-all snap-start"
          >
            <span className="text-[28px] mb-1.5" aria-hidden>
              {cat.icon}
            </span>
            <span className="text-[13px] font-medium text-gray-900 text-center line-clamp-1 px-1">
              {cat.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
