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

interface TopFilmCuratorsProps {
  curator: CategoryCuratorCard | null;
  curators: CategoryCuratorCard[];
  categoryName: string;
  accentColor?: string;
}

/** کیوریتورهای برتر فیلم — کارت بزرگ با پوسترها */
export default function TopFilmCurators({
  curator,
  curators,
  categoryName,
  accentColor = '#A855F7',
}: TopFilmCuratorsProps) {
  const topCurator = curator ?? curators[0];
  if (!topCurator) return null;

  const topLists = topCurator.topLists ?? [];

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        🏆 کیوریتور سینمای هفته
      </h2>
      <p className="text-sm text-gray-600 mt-0.5 mb-5">
        برترین کیوریتورهای {categoryName}
      </p>

      <Link
        href={topCurator.username ? `/u/${topCurator.username}` : '#'}
        className="block p-6 rounded-2xl bg-gray-900 border-2 border-gray-800 shadow-xl active:scale-[0.99] transition-transform"
        style={{ borderColor: `${accentColor}40` }}
      >
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative">
              {topCurator.image ? (
                <ImageWithFallback
                  src={topCurator.image}
                  alt={topCurator.name || 'کیوریتور'}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white/20"
                  width={96}
                  height={96}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {(topCurator.name || '?')[0]}
                </div>
              )}
              <span
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                🥇
              </span>
            </div>
            <div>
              <p className="font-bold text-xl text-white">
                {topCurator.name || 'کاربر'}
              </p>
              <p className="text-sm font-medium opacity-80" style={{ color: accentColor }}>
                {LEVEL_LABELS[topCurator.curatorLevel] || topCurator.curatorLevel}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {topCurator.listCount} لیست • {topCurator.totalSaves} ذخیره کل
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {topCurator.followersCount} دنبال‌کننده
              </p>
            </div>
          </div>

          {topLists.length > 0 && (
            <div className="flex-1 flex gap-3 overflow-x-auto min-w-0">
              {topLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 w-20 rounded-xl overflow-hidden border border-gray-700 group"
                >
                  {list.coverImage ? (
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <ImageWithFallback
                        src={list.coverImage}
                        alt={list.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        placeholderSize="square"
              sizes="80px"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full aspect-[3/4] flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${accentColor}30` }}
                    >
                      🎬
                    </div>
                  )}
                  <p className="text-[10px] font-medium text-gray-300 px-1 py-1 truncate bg-gray-900/80">
                    {list.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Link>

      {curators.length > 1 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {curators.slice(1, 4).map((c, i) => (
            <Link
              key={c.id}
              href={c.username ? `/u/${c.username}` : '#'}
              className="flex items-center gap-2 p-2 rounded-xl bg-gray-900/80 border border-gray-800 active:scale-[0.98]"
            >
              {c.image ? (
                <ImageWithFallback
                  src={c.image}
                  alt={c.name || ''}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white flex-shrink-0">
                  {(c.name || '?')[0]}
                </div>
              )}
              <span className="text-xs text-gray-200 truncate flex-1">
                {c.name || 'کاربر'}
              </span>
              <span className="text-[10px] text-gray-500">#{i + 2}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
