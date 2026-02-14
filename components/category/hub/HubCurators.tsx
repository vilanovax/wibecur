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

interface HubCuratorsProps {
  topCurator: CategoryCuratorCard | null;
  curators: CategoryCuratorCard[];
  categoryName: string;
  accentColor?: string;
}

/** کیوریتورهای برتر — کارت شماره ۱ بزرگ، ۳ کارت کوچک افقی */
export default function HubCurators({
  topCurator,
  curators,
  categoryName,
  accentColor = '#EA580C',
}: HubCuratorsProps) {
  const spotlight = topCurator ?? curators[0];
  const others = spotlight ? curators.filter((c) => c.id !== spotlight.id).slice(0, 3) : curators.slice(1, 4);

  if (curators.length === 0) return null;

  const allCurators = spotlight ? [spotlight, ...others] : curators.slice(0, 4);
  const rankLabels = ['۱', '۲', '۳', '۴'];

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        👑 کیوریتورهای برتر {categoryName}
      </h2>
      <p className="text-sm text-gray-600">
        برترین کیوریتورها در این دسته
      </p>

      <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {allCurators.map((c, i) => (
          <Link
            key={c.id}
            href={c.username ? `/u/${c.username}` : '#'}
            className={`flex-shrink-0 snap-start rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-md active:scale-[0.98] transition-transform ${
              i === 0 ? 'w-[200px]' : 'w-[140px]'
            }`}
            style={
              i === 0
                ? {
                    background: `linear-gradient(180deg, ${accentColor}12 0%, white 30%)`,
                  }
                : {}
            }
          >
            <div className="p-3 text-center">
              <div className="relative inline-block">
                {c.image ? (
                  <ImageWithFallback
                    src={c.image}
                    alt={c.name || 'کیوریتور'}
                    className={`rounded-2xl object-cover ring-2 ring-white shadow ${
                      i === 0 ? 'w-16 h-16' : 'w-12 h-12'
                    }`}
                  />
                ) : (
                  <div
                    className={`rounded-2xl flex items-center justify-center font-bold text-white shadow ${
                      i === 0 ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-sm'
                    }`}
                    style={{ backgroundColor: accentColor }}
                  >
                    {(c.name || '?')[0]}
                  </div>
                )}
                <span
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: accentColor }}
                >
                  {rankLabels[i] ?? i + 1}
                </span>
              </div>
              <p
                className={`font-semibold text-gray-900 mt-1.5 truncate ${
                  i === 0 ? 'text-sm' : 'text-xs'
                }`}
              >
                {c.name || 'کاربر'}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {c.savesThisWeek ?? 0} ذخیره این هفته • {c.listCount} لیست
              </p>
              <span
                className="inline-block mt-2 py-1.5 px-3 rounded-xl text-xs font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                دنبال کردن
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
