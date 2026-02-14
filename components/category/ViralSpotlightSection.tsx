'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface ViralSpotlightSectionProps {
  list: CategoryListCard;
  accentColor?: string;
}

export default function ViralSpotlightSection({
  list,
  accentColor = '#EF4444',
}: ViralSpotlightSectionProps) {
  return (
    <section className="px-4 py-6">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <span>⭐</span>
        وایرال این هفته
      </h2>
      <Link href={`/lists/${list.slug}`} className="block">
        <div
          className="rounded-2xl overflow-hidden border-2 shadow-lg active:scale-[0.99] transition-transform"
          style={{ borderColor: `${accentColor}40` }}
        >
          <div className="relative aspect-video bg-gray-100">
            {list.coverImage ? (
              <ImageWithFallback
                src={list.coverImage}
                alt={list.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-5xl opacity-40"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                📋
              </div>
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
            />
            <span
              className="absolute top-3 right-3 bg-red-500/90 text-white text-xs px-2 py-1 rounded-lg font-bold"
            >
              🚀 Viral
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-bold text-white text-lg drop-shadow-lg">
                {list.title}
              </h3>
              <p className="text-sm text-white/90 mt-0.5">
                {list.saveCount} ذخیره • {list.likeCount} لایک
              </p>
            </div>
          </div>
          <div className="p-3 bg-white">
            <p className="text-xs text-gray-600 text-center">
              ببین چرا وایرال شده →
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
