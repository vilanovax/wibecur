'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CategorySectionTitle from './CategorySectionTitle';
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
      <CategorySectionTitle title={`کیوریتورهای برتر ${categoryName}`} iconVariant="curators" />
      <div className="grid grid-cols-2 gap-3">
        {curators.map((c, index) => (
          <Link
            key={c.id}
            href={c.username ? `/u/${c.username}` : '#'}
            className="flex items-center gap-3 p-3 rounded-lg bg-wibe-card border border-wibe shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="relative flex-shrink-0">
              {c.image ? (
                <ImageWithFallback
                  src={c.image}
                  alt={c.name || 'کاربر'}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-wibe-surface flex items-center justify-center text-lg">
                  {(c.name || '?')[0]}
                </div>
              )}
              {index < 3 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-warning text-white wibe-caption flex items-center justify-center font-bold">
                  {index + 1}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="wibe-small font-semibold text-foreground truncate">{c.name || 'کاربر'}</p>
              <p className="wibe-caption text-wibe-secondary">
                {LEVEL_LABELS[c.curatorLevel] || c.curatorLevel}
              </p>
              <p className="wibe-caption text-wibe-secondary mt-0.5">
                {c.listCount} لیست · {c.totalSaves} ذخیره
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
