'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import HomeSectionTitle from './HomeSectionTitle';

export default function TrendingThisWeekCarousel() {
  const { data, isLoading } = useHomeData();
  const lists = (data?.trending ?? []).slice(0, 6);

  if (isLoading && lists.length === 0) {
    return (
      <section className="mb-6">
        <div className="px-4 mb-3">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 px-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[140px] h-[187px] rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) return null;

  return (
    <section className="mb-6">
      <HomeSectionTitle
        icon="🔥"
        title="ترند این هفته"
        subtitle="بر اساس ذخیره و تعامل"
      />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory -mx-1">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[140px] snap-start"
          >
            <div className="rounded-lg overflow-hidden bg-wibe-card border border-wibe shadow-card w-[140px] h-[187px]">
              <div className="relative h-full w-full bg-gray-100">
                <span className="absolute top-2 right-2 z-10 bg-warning text-white wibe-caption font-semibold px-2 py-0.5 rounded-pill">
                  ترند
                </span>
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  fallbackIcon="📋"
                  fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="wibe-small font-semibold text-white line-clamp-2">{list.title}</h3>
                  <p className="flex items-center gap-1 mt-1.5 wibe-caption text-white/80">
                    <Bookmark className="w-3.5 h-3.5" />
                    {list.saveCount.toLocaleString('fa-IR')} ذخیره
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
