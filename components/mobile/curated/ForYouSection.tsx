'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { CuratedList } from '@/types/curated';

interface ForYouSectionProps {
  lists: CuratedList[];
}

export default function ForYouSection({ lists }: ForYouSectionProps) {
  const forYou = lists
    .filter((l) => l.badges.includes('featured') || l.creator.badges.includes('top'))
    .slice(0, 6);

  if (forYou.length === 0) return null;

  return (
    <section
      id="foryou"
      className="px-4 py-8"
      aria-labelledby="foryou-title"
    >
      <h2
        id="foryou-title"
        className="text-[18px] font-bold text-gray-900 mb-2 flex items-center gap-2"
      >
        <span aria-hidden>✨</span>
        برای تو
      </h2>
      <p className="text-[13px] text-gray-500 mb-4">
        بر اساس ذخیره‌ها و رفتار قبلی
      </p>
      <div className="space-y-4">
        {forYou.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-4 p-4 rounded-[18px] bg-white border-2 border-primary/20 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="w-24 h-24 rounded-[14px] overflow-hidden bg-gray-200 flex-shrink-0">
              <ImageWithFallback
                src={list.coverUrl ?? ''}
                alt={list.title}
                className="w-full h-full object-cover"
                fallbackIcon="📋"
                fallbackClassName="w-full h-full flex items-center justify-center text-xl"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-primary font-medium mb-1">
                چون اینو ذخیره کردی…
              </p>
              <h3 className="font-semibold text-[16px] text-gray-900 line-clamp-2">
                {list.title}
              </h3>
              <p className="text-[12px] text-gray-500 mt-1">
                ❤️ {formatNumber(list.savesCount)} · {list.creator.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
