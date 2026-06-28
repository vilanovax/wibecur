'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CategorySectionTitle from '../CategorySectionTitle';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import type { CategoryItemCard } from '@/types/category-page';

interface LatestItemsSectionProps {
  items: CategoryItemCard[];
  accentColor?: string;
  inset?: boolean;
}

export default function LatestItemsSection({
  items,
  accentColor = '#EA580C',
  inset = false,
}: LatestItemsSectionProps) {
  if (items.length === 0) return null;

  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <CategorySectionTitle
        title="آخرین آیتم‌ها"
        subtitle="تازه‌ترین آیتم‌های اضافه‌شده به لیست‌ها"
        icon="🆕"
      />

      <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/lists/${item.listSlug}#item-${item.id}`}
            className="w-24 shrink-0 transition-transform active:scale-[0.97]"
          >
            <div className="aspect-square overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm">
              {item.imageUrl ? (
                <ImageWithFallback
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  placeholderSize="square"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-2xl opacity-40"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  📋
                </div>
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 wibe-caption font-medium leading-tight text-foreground">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
