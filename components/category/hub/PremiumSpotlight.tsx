'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface PremiumSpotlightProps {
  list: CategoryListCard | null;
  accentColor?: string;
}

/** اسلات مونتیزیشن — کارت ویژه با طراحی Premium */
export default function PremiumSpotlight({
  list,
  accentColor = '#EA580C',
}: PremiumSpotlightProps) {
  if (!list) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        💎 انتخاب ویژه
      </h2>
      <p className="text-[11px] text-gray-500">
        پیشنهاد این ماه
      </p>

      <Link
        href={`/lists/${list.slug}`}
        className="mt-2 block rounded-2xl overflow-hidden border-2 shadow-lg active:scale-[0.99] transition-transform relative"
        style={{
          borderColor: `${accentColor}40`,
          boxShadow: `0 4px 20px ${accentColor}20`,
        }}
      >
        <span className="absolute top-2 left-2 z-10 text-[10px] font-medium text-white/90 bg-black/40 px-2 py-0.5 rounded-lg backdrop-blur-sm">
          Sponsored
        </span>
        <div className="relative aspect-[3/2] bg-gray-100">
          {list.coverImage ? (
            <ImageWithFallback
              src={list.coverImage}
              alt={list.title}
              className="w-full h-full object-cover"
              placeholderSize="cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-5xl opacity-50"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              💎
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
        <div className="p-4 bg-white">
          <h3 className="font-bold text-gray-900 text-base">{list.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {list.creator?.name || 'کیوریتور'}
          </p>
          <p className="text-sm font-semibold mt-2" style={{ color: accentColor }}>
            ⭐ {list.saveCount} ذخیره
          </p>
        </div>
      </Link>
    </section>
  );
}
