'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { Curator } from '@/types/curated';

interface RisingCuratorsSectionProps {
  curators: Curator[];
}

export default function RisingCuratorsSection({ curators }: RisingCuratorsSectionProps) {
  const rising = curators
    .filter((c) => (c.weeklyGrowthPercent ?? 0) > 15)
    .sort((a, b) => (b.weeklyGrowthPercent ?? 0) - (a.weeklyGrowthPercent ?? 0))
    .slice(0, 5);

  if (rising.length === 0) return null;

  return (
    <section
      id="rising-curators"
      className="px-4 py-8 bg-gradient-to-b from-green-50/40 to-transparent rounded-t-[24px] -mt-4"
      aria-labelledby="rising-curators-title"
    >
      <h2
        id="rising-curators-title"
        className="text-[18px] font-bold text-gray-900 mb-3 flex items-center gap-2"
      >
        <span aria-hidden>🌱</span>
        ستاره‌های در حال ظهور
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {rising.map((c) => (
          <Link
            key={c.id}
            href={`/u/${c.username}`}
            className="flex-shrink-0 w-[120px] rounded-[18px] bg-white border border-green-100 p-3 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mx-auto">
              <ImageWithFallback
                src={c.avatarUrl ?? ''}
                alt={c.name}
                className="w-full h-full object-cover"
                fallbackIcon="👤"
                fallbackClassName="w-full h-full flex items-center justify-center"
              />
            </div>
            <h4 className="font-semibold text-[13px] mt-2 text-center line-clamp-1 text-gray-900">
              {c.name}
            </h4>
            <p className="text-[11px] text-green-600 font-medium text-center mt-1">
              +{c.weeklyGrowthPercent}% این هفته
            </p>
            <p className="text-[10px] text-gray-500 text-center mt-0.5">
              {formatNumber(c.savesLast7d ?? 0)} ذخیره
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
