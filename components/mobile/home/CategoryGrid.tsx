'use client';

import Link from 'next/link';

const categories = [
  { id: 'movies', name: 'فیلم و سریال', icon: '🎬', slug: 'movies' },
  { id: 'books', name: 'کتاب', icon: '📚', slug: 'books' },
  { id: 'cafe', name: 'کافه و رستوران', icon: '☕', slug: 'cafe' },
  { id: 'car', name: 'ماشین و تکنولوژی', icon: '🚗', slug: 'car' },
  { id: 'podcast', name: 'پادکست', icon: '🎧', slug: 'podcast' },
  { id: 'lifestyle', name: 'لایف‌استایل', icon: '🌱', slug: 'lifestyle' },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center space-y-2"
        >
          <span className="text-4xl">{category.icon}</span>
          <span className="text-sm font-medium text-gray-700 text-center">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

