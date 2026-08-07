'use client';

import CategorySectionTitle from '../CategorySectionTitle';
import CategoryItemChipLink, {
  type CategoryItemChipLayout,
} from '../CategoryItemChipLink';
import HorizontalScrollFade from '@/components/shared/HorizontalScrollFade';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import type { CategoryItemCard } from '@/types/category-page';

interface LatestItemsSectionProps {
  items: CategoryItemCard[];
  accentColor?: string;
  inset?: boolean;
  itemLayout?: CategoryItemChipLayout;
}

export default function LatestItemsSection({
  items,
  accentColor = '#EA580C',
  inset = false,
  itemLayout = 'tile',
}: LatestItemsSectionProps) {
  if (items.length === 0) return null;

  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <CategorySectionTitle
        title="آخرین آیتم‌ها"
        subtitle="تازه‌ترین آیتم‌های اضافه‌شده به لیست‌ها"
        iconVariant="new"
      />

      <HorizontalScrollFade surface="surface" innerClassName="-mx-1 flex gap-3 pb-1">
        {items.map((item) => (
          <CategoryItemChipLink
            key={item.id}
            item={item}
            accentColor={accentColor}
            layout={itemLayout}
          />
        ))}
      </HorizontalScrollFade>
    </section>
  );
}
