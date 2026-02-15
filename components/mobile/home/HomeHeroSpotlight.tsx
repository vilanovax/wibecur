'use client';

import Link from 'next/link';
import { Eye, Star } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';

export default function HomeHeroSpotlight() {
  const { data, isLoading } = useHomeData();
  const list = data?.featured ?? null;

  if (isLoading || !list) {
    if (!isLoading && !list) return null;
    return (
      <section className="px-4 mt-4 mb-6">
        <div className="rounded-[20px] h-[240px] bg-gray-200 animate-pulse shadow-vibe-hero" />
      </section>
    );
  }

  const creator = list.creator;

  return (
    <section className="px-4 mt-4 mb-6">
      <p className="text-[12px] font-medium text-gray-500 mb-2">منتخب هفته</p>
      <div className="relative rounded-[20px] overflow-hidden h-[240px] bg-gray-200 shadow-vibe-hero">
        <ImageWithFallback
          src={list.coverImage}
          alt={list.title}
          className="absolute inset-0 w-full h-full object-cover"
          fallbackIcon="🎬"
          fallbackClassName="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-300 to-gray-400"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-[26px] font-bold text-white leading-[1.3] tracking-[-0.03em] drop-shadow-lg line-clamp-2">
            {list.title}
          </h1>
          <p className="text-white/95 text-[14px] mt-2 leading-[1.6] line-clamp-2 opacity-90">{list.description}</p>
          {creator?.name && (
            <p className="text-white/70 text-[11px] mt-1.5 opacity-75">از {creator.name}</p>
          )}
          <div className="flex gap-3 mt-4">
            <Link
              href={`/lists/${list.slug}`}
              className="flex-1 py-3 rounded-xl bg-white text-gray-900 font-semibold text-[14px] text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              مشاهده لیست
            </Link>
            <Link
              href={`/lists/${list.slug}`}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-primary text-white font-semibold text-[14px] hover:bg-primary-dark transition-colors"
              aria-label="ذخیره سریع لیست"
            >
              <Star className="w-4 h-4" />
              ذخیره سریع
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
