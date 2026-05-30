'use client';

import Link from 'next/link';
import ListCard from '@/components/mobile/home/ListCard';
import { useHomeData } from '@/contexts/HomeDataContext';

export default function TrendingLists() {
  const { data, isLoading } = useHomeData();
  const lists = data?.trending ?? [];

  if (isLoading && lists.length === 0) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-3">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 px-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl h-40 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) {
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
      <div className="grid grid-cols-2 gap-3 px-4">
        {lists.map((list, idx) => (
          <ListCard
            key={list.id}
            id={list.id}
            title={list.title}
            description={list.description}
            coverImage={list.coverImage}
            slug={list.slug}
            likes={list.likes}
            saves={list.saveCount}
            itemCount={list.itemCount}
            badge={list.badge}
            priority={idx < 2}
          />
        ))}
      </div>
    </section>
  );
}
