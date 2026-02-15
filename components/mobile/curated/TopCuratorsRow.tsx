'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatNumber } from '@/lib/curated/utils';
import type { Curator } from '@/types/curated';

const BADGE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  top: { label: 'برتر', icon: '👑', color: 'bg-amber-100 text-amber-800' },
  rising: { label: 'در حال رشد', icon: '🚀', color: 'bg-purple-100 text-purple-800' },
  elite: { label: 'الیت', icon: '💎', color: 'bg-slate-200 text-slate-800' },
  ai: { label: 'AI', icon: '🧠', color: 'bg-blue-100 text-blue-800' },
  featured: { label: 'ویژه', icon: '✨', color: 'bg-pink-100 text-pink-800' },
};

interface TopCuratorsRowProps { curators: Curator[]; }

export default function TopCuratorsRow({ curators }: TopCuratorsRowProps) {
  return (
    <section className="px-4 py-4">
      <h3 className="font-bold text-[16px] text-gray-900 mb-3">کیوریتورهای برتر این هفته</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {curators.map((c) => (
          <Link key={c.id} href={`/u/${c.username}`} className="flex-shrink-0 w-[140px] rounded-[18px] bg-white border p-4 shadow-sm">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 mx-auto">
              <ImageWithFallback src={c.avatarUrl ?? ''} alt={c.name} className="w-full h-full object-cover" fallbackIcon="👤" fallbackClassName="w-full h-full flex items-center justify-center text-2xl" />
            </div>
            <h4 className="font-semibold text-[14px] mt-2 text-center line-clamp-1">{c.name}</h4>
            <p className="text-[11px] text-gray-500 text-center mt-1">{formatNumber(c.followersCount)} دنبال · {c.listsCount} لیست</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
