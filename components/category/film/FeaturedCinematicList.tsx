'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface FeaturedCinematicListProps {
  list: CategoryListCard;
}

/** بلاک بزرگ Featured — Scene of the Week */
export default function FeaturedCinematicList({ list }: FeaturedCinematicListProps) {
  const tagline = list.description || 'فیلم‌هایی که بعد از دیدنشان زندگی‌ات تغییر می‌کند';
  const shortTagline = tagline.length > 60 ? tagline.slice(0, 57) + '...' : tagline;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
        🎞 صحنهٔ هفته
      </h2>

      <Link href={`/lists/${list.slug}`} className="block group">
        <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm active:scale-[0.99] transition-transform">
          <div className="relative aspect-[21/9] min-h-[160px] bg-gray-800">
            {list.coverImage ? (
              <ImageWithFallback
                src={list.coverImage}
                alt={list.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                placeholderSize="cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl opacity-40 bg-gradient-to-br from-purple-900/50 to-gray-900">
                🎬
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              <p className="text-lg md:text-xl font-medium text-white/95 italic drop-shadow-lg max-w-2xl">
                &ldquo;{shortTagline}&rdquo;
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-white/90">
                <span>By {list.creator?.name || 'کیوریتور'}</span>
                <span>⭐ {(list.likeCount / (list.itemCount || 1) || 0).toFixed(1)}</span>
                <span>❤️ {list.saveCount}</span>
                <span>💬 {list.commentCount ?? 0}</span>
              </div>
              <span
                className="mt-4 inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm text-gray-900 transition-all"
                style={{ backgroundColor: '#F5C36A' }}
              >
                مشاهده لیست
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
