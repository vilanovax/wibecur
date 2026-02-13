'use client';

import { useState, useEffect } from 'react';
import ListCard from '@/components/mobile/home/ListCard';
import EmptyState from '@/components/mobile/home/EmptyState';
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

export default function RecommendationSection() {
  const [lists, setLists] = useState<HomeList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lists/home')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.recommendations)) {
          setLists(
            json.data.recommendations.map((l: any) => ({
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

  const hasRecommendations = lists.length > 0;

  if (loading && !hasRecommendations) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-3">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 px-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl h-40 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="px-4 mb-3">
        <h2 className="text-lg font-bold text-gray-900">برای تو ✨</h2>
        <p className="text-gray-500 text-sm mt-0.5">بر اساس ذخیره‌های اخیرت</p>
      </div>
      {hasRecommendations ? (
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
      ) : (
        <EmptyState
          icon="✨"
          title="هنوز چیزی ذخیره نکردی 🙂"
          description="چند تا لیست انتخاب کن تا وایبت رو بشناسیم"
          buttonText="دیدن لیست‌های پیشنهادی"
          buttonHref="/lists"
        />
      )}
    </section>
  );
}
