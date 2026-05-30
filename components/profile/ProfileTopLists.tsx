'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import type { TopListItem } from './types';

interface ProfileTopListsProps {
  userId: string;
}

async function fetchTopLists(): Promise<TopListItem[]> {
  const res = await fetch('/api/user/my-lists?page=1&limit=3');
  const data = await res.json();
  if (!data.success || !Array.isArray(data.data?.lists)) return [];
  const lists = data.data.lists as (TopListItem & {
    likeCount?: number;
    saveCount?: number;
    _count?: { list_likes: number; bookmarks: number };
  })[];
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
        <div className="h-5 w-32 bg-gray-200 rounded mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-[72%] max-w-[200px] shrink-0 rounded-lg bg-gray-200 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="wibe-h3 mb-3">برترین لیست‌های شما</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 scrollbar-hide" dir="ltr">
        <div className="flex gap-3" style={{ direction: 'rtl' }}>
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.slug}`}
              className="block w-[72%] max-w-[200px] shrink-0 rounded-lg overflow-hidden border border-wibe bg-wibe-card shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-gray-200">
                <ImageWithFallback
                  src={list.coverImage ?? ''}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  fallbackIcon="📋"
                  fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-gray-200"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2" dir="rtl">
                  <p className="wibe-small font-semibold text-white line-clamp-2">{list.title}</p>
                  <ListCardStats
                    saves={list.saveCount ?? 0}
                    itemCount={list.itemCount ?? 0}
                    variant="overlay"
                    className="mt-1"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-2 wibe-caption text-wibe-secondary">لیست‌های بیشتر در تب «لیست‌های من»</p>
    </section>
  );
}
