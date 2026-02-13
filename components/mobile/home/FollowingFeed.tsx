'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, UserPlus } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface FollowingList {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  saveCount: number;
  itemCount: number;
  likes: number;
  updatedAt: string;
  creator: { id: string; name: string | null; username: string | null } | null;
  categories: { name: string; icon: string; slug: string } | null;
}

export default function FollowingFeed() {
  const [lists, setLists] = useState<FollowingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<'ok' | 'no_following' | 'login_required'>('ok');

  useEffect(() => {
    fetch('/api/lists/following')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.lists)) {
          setLists(json.data.lists);
          setMessage(json.data.message ?? 'ok');
        }
      })
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Loader2 className="w-10 h-10 text-[#7C3AED] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">در حال بارگذاری...</p>
      </div>
    );
  }

  if (message === 'login_required' || (message === 'no_following' && lists.length === 0)) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-[#7C3AED]" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">لیست‌های کریتورهایی که دنبال می‌کنی</h3>
        <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
          با دنبال کردن کیوریتورها، لیست‌های جدید آن‌ها اینجا نمایش داده می‌شود.
        </p>
        <Link
          href="/lists"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-medium"
        >
          کشف لیست‌ها
        </Link>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-500 text-sm">هنوز لیست جدیدی از کریتورهای دنبال‌شده نیست.</p>
        <Link href="/lists" className="text-[#7C3AED] text-sm font-medium mt-2 inline-block">
          مشاهده ترند
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">جدید از دنبال‌شده‌ها</h2>
      <div className="grid grid-cols-2 gap-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="block rounded-2xl bg-white overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
              <ImageWithFallback
                src={list.coverImage}
                alt={list.title}
                className="w-full h-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="w-full h-full flex items-center justify-center text-2xl"
              />
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{list.title}</h3>
              {list.creator?.username && (
                <p className="text-xs text-gray-500 mt-0.5">@{list.creator.username}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                <span>{list.itemCount} آیتم</span>
                <span>·</span>
                <span>{list.saveCount} ذخیره</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
