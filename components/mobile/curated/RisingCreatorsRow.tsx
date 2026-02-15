'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { Curator } from '@/types/curated';

interface RisingCreatorsRowProps {
  curators: Curator[];
}

export default function RisingCreatorsRow({ curators }: RisingCreatorsRowProps) {
  const rising = curators.filter((c) => (c.weeklyGrowthPercent ?? 0) > 15).slice(0, 3);
  if (rising.length === 0) return null;

  return (
    <section className="px-4 py-4">
      <h3 className="font-bold text-[16px] text-gray-900 mb-3">کیوریتورهای در حال رشد</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {rising.map((c) => (
          <Link key={c.id} href={`/u/${c.username}`} className="flex-shrink-0 w-[120px] rounded-[16px] bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 p-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm mx-auto">
              <ImageWithFallback src={c.avatarUrl ?? ''} alt={c.name} className="w-full h-full object-cover" fallbackIcon="👤" fallbackClassName="w-full h-full flex items-center justify-center" />
            </div>
            <h4 className="font-semibold text-[13px] mt-2 text-center line-clamp-1">{c.name}</h4>
            <p className="text-[11px] text-green-600 font-medium text-center mt-1">+{c.weeklyGrowthPercent}% این هفته</p>
            <p className="text-[10px] text-gray-500 text-center mt-0.5">{formatNumber(c.savesLast7d ?? 0)} ذخیره</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
