'use client';

import Link from 'next/link';

const categories = [
  { id: 'movie', name: '🎬 فیلم', icon: '🎬', slug: 'movie', color: 'bg-purple-100' },
  { id: 'cafe', name: '☕ کافه', icon: '☕', slug: 'cafe', color: 'bg-amber-100' },
  { id: 'book', name: '📚 کتاب', icon: '📚', slug: 'book', color: 'bg-orange-100' },
  { id: 'podcast', name: '🎧 پادکست', icon: '🎧', slug: 'podcast', color: 'bg-pink-100' },
];

export default function CategoryScroll() {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold px-4 mb-4 text-gray-900">دسته‌بندی‌ها</h2>
      <div className="flex gap-4 px-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="flex-shrink-0 w-24 group snap-start"
          >
            <div
              className={`${category.color} rounded-2xl p-5 aspect-square flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm border border-white/50`}
            >
              <span className="text-4xl">{category.icon}</span>
            </div>
            <p className="text-center text-sm font-medium mt-2 text-gray-700">
              {category.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

