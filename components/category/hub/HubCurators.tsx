'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CategorySectionTitle from '../CategorySectionTitle';
import type { CategoryCuratorCard } from '@/types/category-page';

interface HubCuratorsProps {
  topCurator: CategoryCuratorCard | null;
  curators: CategoryCuratorCard[];
  categoryName: string;
  accentColor?: string;
}

export default function HubCurators({
  topCurator,
  curators,
  categoryName,
}: HubCuratorsProps) {
  const spotlight = topCurator ?? curators[0];
  const others = spotlight ? curators.filter((c) => c.id !== spotlight.id).slice(0, 3) : curators.slice(1, 4);

  if (curators.length === 0) return null;

  const allCurators = spotlight ? [spotlight, ...others] : curators.slice(0, 4);
  const rankLabels = ['۱', '۲', '۳', '۴'];

  return (
    <section className="px-4 py-6">
      <CategorySectionTitle
        title={`کیوریتورهای برتر ${categoryName}`}
        subtitle="برترین کیوریتورها در این دسته"
        icon="👑"
      />

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {allCurators.map((c, i) => (
          <Link
            key={c.id}
            href={c.username ? `/u/${c.username}` : '#'}
            className={`flex-shrink-0 snap-start rounded-lg overflow-hidden bg-wibe-card border border-wibe shadow-sm active:scale-[0.99] transition-transform ${
              i === 0 ? 'w-[200px]' : 'w-[140px]'
            }`}
          >
            <div className="p-3 text-center">
              <div className="relative inline-block">
                {c.image ? (
                  <ImageWithFallback
                    src={c.image}
                    alt={c.name || 'کیوریتور'}
                    className={`rounded-lg object-cover ring-2 ring-wibe-card shadow ${
                      i === 0 ? 'w-16 h-16' : 'w-12 h-12'
                    }`}
                  />
                ) : (
                  <div
                    className={`rounded-lg flex items-center justify-center font-bold text-white bg-primary shadow ${
                      i === 0 ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-sm'
                    }`}
                  >
                    {(c.name || '?')[0]}
                  </div>
                )}
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center wibe-caption font-bold text-white bg-warning shadow">
                  {rankLabels[i] ?? i + 1}
                </span>
              </div>
              <p className={`font-semibold text-foreground mt-1.5 truncate ${i === 0 ? 'wibe-small' : 'wibe-caption'}`}>
                {c.name || 'کاربر'}
              </p>
              <p className="wibe-caption text-wibe-secondary mt-0.5">
                {c.savesThisWeek ?? 0} ذخیره · {c.listCount} لیست
              </p>
              <span className="inline-block mt-2 py-1.5 px-3 rounded-md wibe-caption font-semibold text-white bg-primary">
                دنبال کردن
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
