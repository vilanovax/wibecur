'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface TrendingListsSectionProps {
  title: string;
  subtitle?: string;
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
  /** کارت بهبودیافته با آواتار و city badge */
  improved?: boolean;
}

export default function TrendingListsSection({
  title,
  subtitle,
  lists,
  accentColor = '#8B5CF6',
  improved = false,
}: TrendingListsSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span>🔥</span>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      )}
      <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {lists.map((list, index) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[75vw] max-w-[300px] snap-start"
          >
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
              <div className="relative aspect-[4/3] bg-gray-100">
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-4xl opacity-40"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    📋
                  </div>
                )}
                {(index < 3 || list.badge === 'viral' || list.badge === 'hot') && (
                  <span
                    className={`absolute top-2 right-2 text-white text-xs px-2 py-0.5 rounded-lg font-medium ${
                      list.badge === 'viral'
                        ? 'bg-red-500/90'
                        : list.badge === 'hot'
                        ? 'bg-orange-500/90'
                        : 'bg-orange-500/90'
                    }`}
                  >
                    {list.badge === 'viral' ? '🔥 Viral' : list.badge === 'hot' ? '🔥 Hot' : '🔥 Trending'}
                  </span>
                )}
                {improved && list.cityTag && (
                  <span className="absolute bottom-2 right-2 text-white/95 text-xs px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
                    📍 {list.cityTag}
                  </span>
                )}
              </div>
              <div className="p-3">
                {improved && list.creator && (
                  <div className="flex items-center gap-2 mb-1.5">
                    {list.creator.image ? (
                      <ImageWithFallback
                        src={list.creator.image}
                        alt={list.creator.name || ''}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs flex-shrink-0">
                        {(list.creator.name || '?')[0]}
                      </div>
                    )}
                    <span className="text-xs text-gray-500 truncate">
                      {list.creator.name || 'کاربر'}
                    </span>
                  </div>
                )}
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                  {list.title}
                </h3>
                <div className="flex gap-3 mt-2">
                  <span className="text-sm font-bold text-primary">⭐ {list.saveCount}</span>
                  <span className="text-xs text-gray-500">❤️ {list.likeCount}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
