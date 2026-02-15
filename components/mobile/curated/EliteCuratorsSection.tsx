'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { Curator } from '@/types/curated';

const SPECIALTY_MAP: Record<string, string> = {
  top: 'کیوریتور برتر',
  elite: 'الیت',
  featured: 'ویژه',
  ai: 'AI',
};

interface EliteCuratorsSectionProps {
  curators: Curator[];
}

export default function EliteCuratorsSection({ curators }: EliteCuratorsSectionProps) {
  const elite = curators
    .filter((c) => c.badges.includes('top') || c.badges.includes('elite'))
    .sort((a, b) => b.followersCount - a.followersCount)
    .slice(0, 6);

  if (elite.length === 0) return null;

  return (
    <section
      id="elite"
      className="px-4 py-8"
      aria-labelledby="elite-title"
    >
      <h2
        id="elite-title"
        className="text-[18px] font-bold text-gray-900 mb-3 flex items-center gap-2"
      >
        <span aria-hidden>🏆</span>
        کیوریتورهای برتر این هفته
      </h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {elite.map((c) => (
          <Link
            key={c.id}
            href={`/u/${c.username}`}
            className="flex-shrink-0 w-[140px] rounded-[18px] bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
          >
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 mx-auto ring-2 ring-amber-200">
              <ImageWithFallback
                src={c.avatarUrl ?? ''}
                alt={c.name}
                className="w-full h-full object-cover"
                fallbackIcon="👤"
                fallbackClassName="w-full h-full flex items-center justify-center text-xl"
              />
            </div>
            <h4 className="font-semibold text-[14px] mt-2 text-center line-clamp-1 text-gray-900">
              {c.name}
            </h4>
            <p className="text-[11px] text-gray-500 text-center mt-0.5">
              {SPECIALTY_MAP[c.badges[0]] ?? c.levelTitle}
            </p>
            <p className="text-[11px] text-gray-500 text-center mt-1">
              {formatNumber(c.followersCount)} دنبال · ⭐ {Math.round((c.totalSaves / 1000) * 10) / 10}k ذخیره
            </p>
            <span className="block w-full mt-2 py-2 rounded-xl bg-primary text-white text-[12px] font-medium text-center hover:bg-primary-dark transition-colors">
              دنبال کردن
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
