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

interface TopFilmCuratorsVIPProps {
  curator: CategoryCuratorCard | null;
  curators: CategoryCuratorCard[];
  categoryName: string;
}

/** کیوریتورهای VIP — Avatar بزرگ، Badge Pro Critic */
export default function TopFilmCuratorsVIP({
  curator,
  curators,
  categoryName,
}: TopFilmCuratorsVIPProps) {
  const topCurator = curator ?? curators[0];
  if (!topCurator) return null;

  const filmScore = Math.min(5, 3.5 + (topCurator.totalSaves + topCurator.totalLikes) / 500).toFixed(1);

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        🏆 کیوریتورهای برتر فیلم
      </h2>
      <p className="text-sm text-gray-600 mt-0.5 mb-5">
        برترین کیوریتورهای {categoryName}
      </p>

      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
        <Link
          href={topCurator.username ? `/u/${topCurator.username}` : '#'}
          className="flex-shrink-0 flex flex-col items-center p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-lg min-w-[140px]"
        >
          <div className="relative">
            {topCurator.image ? (
              <ImageWithFallback
                src={topCurator.image}
                alt={topCurator.name || 'کیوریتور'}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-amber-300"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                {(topCurator.name || '?')[0]}
              </div>
            )}
            <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm bg-amber-400 text-gray-900 font-bold">
              🎬
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-600 mt-2 px-2 py-0.5 rounded bg-amber-100">
            Pro Critic
          </span>
          <span className="font-bold text-gray-900 text-sm mt-1 truncate max-w-full">
            {topCurator.name || 'کاربر'}
          </span>
          <span className="text-xs text-gray-600 mt-0.5">
            🔥 {topCurator.listCount} لیست وایرال
          </span>
          <span className="text-xs text-amber-600 mt-1">
            ⭐ {filmScore} تخصص فیلم
          </span>
        </Link>

        {curators.slice(1, 5).map((c, i) => (
          <Link
            key={c.id}
            href={c.username ? `/u/${c.username}` : '#'}
            className="flex-shrink-0 flex flex-col items-center p-4 rounded-2xl bg-white border border-gray-200 shadow-sm min-w-[100px]"
          >
            {c.image ? (
              <ImageWithFallback
                src={c.image}
                alt={c.name || ''}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white">
                {(c.name || '?')[0]}
              </div>
            )}
            <span className="text-[10px] text-amber-600 mt-1.5">🎬 Pro</span>
            <span className="text-xs font-medium text-gray-900 mt-0.5 truncate max-w-full">
              {c.name || 'کاربر'}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">#{i + 2}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
