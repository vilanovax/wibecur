'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ListCard from '@/components/mobile/home/ListCard';
import { PLACEHOLDER_COVER_SMALL } from '@/lib/placeholder-images';

interface HomeList {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  saveCount: number;
  itemCount: number;
  likes: number;
  badge?: 'trending' | 'new' | 'featured';
}

export default function TrendingLists() {
  const [lists, setLists] = useState<HomeList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lists/home')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.trending)) {
          setLists(
            json.data.trending.map((l: any) => ({
              id: l.id,
              title: l.title,
              slug: l.slug,
              description: l.description || '',
              coverImage: l.coverImage || PLACEHOLDER_COVER_SMALL,
              saveCount: l.saveCount ?? 0,
              itemCount: l.itemCount ?? 0,
              likes: l.likes ?? 0,
              badge: l.badge,
            }))
          );
        }
      })
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading && lists.length === 0) {
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
        {lists.map((list) => (
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
          />
        ))}
      </div>
    </section>
  );
}
