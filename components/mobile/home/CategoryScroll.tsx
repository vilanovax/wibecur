'use client';

import Link from 'next/link';

const categories = [
  {
    id: 'movies',
    name: 'فیلم و سریال',
    icon: '🎬',
    slug: 'movies',
    color: 'bg-purple-100',
  },
  {
    id: 'books',
    name: 'کتاب',
    icon: '📚',
    slug: 'books',
    color: 'bg-orange-100',
  },
  {
    id: 'cafe',
    name: 'کافه و رستوران',
    icon: '☕',
    slug: 'cafe',
    color: 'bg-amber-100',
  },
  {
    id: 'podcast',
    name: 'پادکست',
    icon: '🎧',
    slug: 'podcast',
    color: 'bg-pink-100',
  },
  {
    id: 'lifestyle',
    name: 'لایف‌استایل',
    icon: '🌱',
    slug: 'lifestyle',
    color: 'bg-green-100',
  },
  {
    id: 'car',
    name: 'ماشین و تکنولوژی',
    icon: '🚗',
    slug: 'car',
    color: 'bg-red-100',
  },
];

export default function CategoryScroll() {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold px-4 mb-4">دسته‌بندی‌ها</h2>
      <div className="flex gap-4 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="flex-shrink-0 w-28 group"
          >
            <div
              className={`${category.color} rounded-2xl p-4 aspect-square flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-200`}
            >
              <span className="text-4xl mb-2">{category.icon}</span>
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

