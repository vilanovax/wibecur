'use client';

import Link from 'next/link';
import ListCard from '@/components/mobile/home/ListCard';

const mockLists = [
  {
    id: '1',
    title: 'بهترین کافه‌های دنج تهران',
    description: 'کافه‌هایی برای خلوت کردن',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=200&fit=crop',
    itemCount: 15,
    saves: 421,
    likes: 120,
  },
  {
    id: '2',
    title: 'کتاب‌های ۵ سال اخیر که باید بخونی',
    description: 'منتخب خواننده‌ها',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=200&fit=crop',
    itemCount: 20,
    saves: 567,
    likes: 200,
  },
];

export default function TrendingLists() {
  if (mockLists.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-bold px-4 mb-2 text-gray-900">لیست‌های ترند 🔥</h2>
        <div className="px-4 py-8 text-center">
          <p className="text-gray-500 mb-2">لیست ترندی پیدا نشد</p>
          <p className="text-gray-400 text-sm">شاید وقتشه اولین وایب رو بسازی 😉</p>
        </div>
      </section>
    );
  }
  return (
    <section className="mb-8">
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">لیست‌های ترند 🔥</h2>
            <p className="text-gray-500 text-xs mt-0.5">این هفته خیلی ذخیره شده</p>
          </div>
          <Link href="/lists" className="text-primary text-sm font-medium">
            همه
          </Link>
        </div>
      </div>
      <div className="px-4 space-y-3">
        {mockLists.map((list) => (
          <div key={list.id}>
            <ListCard {...list} variant="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}
