'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import { PLACEHOLDER_COVER_SMALL } from '@/lib/placeholder-images';

export default function RecommendationsSection() {
  const { data, isLoading } = useHomeData();
  const { data: session } = useSession();
  const lists = (data?.recommendations ?? []).slice(0, 4).map((l) => ({
    ...l,
    coverImage: l.coverImage || PLACEHOLDER_COVER_SMALL,
  }));

  if (isLoading && lists.length === 0) {
    return (
      <section>
        <div className="px-4 mb-3">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="px-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl h-[180px] bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) return null;

  const firstName = session?.user?.name?.split(' ')[0];
  const title = firstName ? `${firstName}، اینا رو ببین` : 'محبوب‌ترین‌ها';

  return (
    <section>
      <div className="px-4 mb-3">
        <h2 className="text-[18px] font-semibold leading-[1.4] text-gray-900 flex items-center gap-2">
          <span>💡</span>
          {title}
        </h2>
        <p className="text-[13px] text-gray-500/80 leading-[1.6] mt-0.5">
          لیست‌هایی که کاربران بیشتر دوست داشتن
        </p>
      </div>
      <div className="px-4 grid grid-cols-2 gap-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-vibe-card hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="relative h-[110px] bg-gray-100">
              <ImageWithFallback
                src={list.coverImage}
                alt={list.title}
                className="w-full h-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-gray-200 to-gray-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-[13px] leading-[1.4] text-gray-900 line-clamp-2">
                {list.title}
              </h3>
              <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-500">
                <Heart className="w-3 h-3" />
                <span>{list.likes.toLocaleString('fa-IR')}</span>
                <span className="mx-0.5">·</span>
                <span>{list.itemCount} آیتم</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
