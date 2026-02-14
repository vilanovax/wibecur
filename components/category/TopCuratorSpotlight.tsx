'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryCuratorCard } from '@/types/category-page';

const LEVEL_LABELS: Record<string, string> = {
  EXPLORER: 'کاوشگر',
  CURATOR: 'کیوریتور',
  EXPERT: 'متخصص',
  MASTER: 'استاد',
};

interface TopCuratorSpotlightProps {
  curator: CategoryCuratorCard;
  categoryName: string;
}

export default function TopCuratorSpotlight({
  curator,
  categoryName,
}: TopCuratorSpotlightProps) {
  const topLists = curator.topLists ?? [];

  return (
    <section className="px-4 py-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span>🥇</span>
        کیوریتور برتر این هفته
      </h2>
      <Link
        href={curator.username ? `/u/${curator.username}` : '#'}
        className="mt-4 flex flex-col sm:flex-row gap-4 p-5 rounded-2xl bg-white border-2 border-amber-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]"
      >
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="relative">
            {curator.image ? (
              <ImageWithFallback
                src={curator.image}
                alt={curator.name || 'کیوریتور'}
                className="w-20 h-20 rounded-full object-cover border-4 border-amber-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white border-4 border-amber-200">
                {(curator.name || '?')[0]}
              </div>
            )}
            <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold shadow">
              ۱
            </span>
          </div>
          <div>
            <p className="font-bold text-lg text-gray-900">
              {curator.name || 'کاربر'}
            </p>
            <p className="text-sm text-amber-700 font-medium">
              {LEVEL_LABELS[curator.curatorLevel] || curator.curatorLevel}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {curator.followersCount} دنبال‌کننده • {curator.listCount} لیست
            </p>
          </div>
        </div>
        {topLists.length > 0 && (
          <div className="flex-1 flex gap-2 overflow-x-auto">
            {topLists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 w-24 rounded-xl overflow-hidden border border-gray-100"
              >
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-200 flex items-center justify-center text-2xl">
                    📋
                  </div>
                )}
                <p className="text-[10px] font-medium text-gray-700 px-1 py-0.5 truncate">
                  {list.title}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Link>
    </section>
  );
}
