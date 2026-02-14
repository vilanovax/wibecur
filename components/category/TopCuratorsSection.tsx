'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryCuratorCard } from '@/types/category-page';

interface TopCuratorsSectionProps {
  curators: CategoryCuratorCard[];
  categoryName: string;
}

const LEVEL_LABELS: Record<string, string> = {
  EXPLORER: 'کاوشگر',
  CURATOR: 'کیوریتور',
  EXPERT: 'متخصص',
  MASTER: 'استاد',
};

export default function TopCuratorsSection({
  curators,
  categoryName,
}: TopCuratorsSectionProps) {
  if (curators.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <span>🏆</span>
        کیوریتورهای برتر {categoryName}
      </h2>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {curators.map((c, index) => (
          <Link
            key={c.id}
            href={c.username ? `/u/${c.username}` : '#'}
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="relative flex-shrink-0">
              {c.image ? (
                <ImageWithFallback
                  src={c.image}
                  alt={c.name || 'کاربر'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                  👤
                </div>
              )}
              {index < 3 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {c.name || 'کاربر'}
              </p>
              <p className="text-xs text-gray-500">
                {LEVEL_LABELS[c.curatorLevel] || c.curatorLevel}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {c.listCount} لیست • {c.totalSaves} ذخیره
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
