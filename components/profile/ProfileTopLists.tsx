'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Heart, Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { TopListItem } from './types';

interface ProfileTopListsProps {
  userId: string;
}

function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

async function fetchTopLists(): Promise<TopListItem[]> {
  const res = await fetch('/api/user/my-lists?page=1&limit=3');
  const data = await res.json();
  if (!data.success || !Array.isArray(data.data?.lists)) return [];
  const lists = data.data.lists as (TopListItem & { likeCount?: number; saveCount?: number; _count?: { list_likes: number; bookmarks: number } })[];
  return lists.slice(0, 3).map((l) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    coverImage: l.coverImage,
    likeCount: l.likeCount ?? l._count?.list_likes ?? 0,
    saveCount: l.saveCount ?? l._count?.bookmarks ?? 0,
    viewCount: (l as { viewCount?: number }).viewCount,
    itemCount: l.itemCount,
    categories: l.categories ?? null,
  }));
}

export default function ProfileTopLists({ userId }: ProfileTopListsProps) {
  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['user', userId, 'top-lists'],
    queryFn: fetchTopLists,
  });

  if (isLoading && lists.length === 0) {
    return (
      <section className="mt-6">
        <div className="h-5 w-32 bg-gray-100 rounded mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-[72%] max-w-[200px] shrink-0 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">برترین لیست‌های شما</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 scrollbar-hide" dir="ltr">
        <div className="flex gap-3" style={{ direction: 'rtl' }}>
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.slug}`}
              className="group block w-[72%] max-w-[200px] shrink-0 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                <ImageWithFallback
                  src={list.coverImage ?? ''}
                  alt={list.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  fallbackIcon="📋"
                  fallbackClassName="w-full h-full flex items-center justify-center text-2xl"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent"
                  aria-hidden
                />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white font-bold text-sm line-clamp-2 drop-shadow" dir="rtl">
                    {list.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-white/90 text-xs">
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="w-3 h-3" />
                      {formatStat(list.likeCount ?? 0)}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Bookmark className="w-3 h-3" />
                      {formatStat(list.saveCount ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">لیست‌های بیشتر در تب «لیست‌های من»</p>
    </section>
  );
}
