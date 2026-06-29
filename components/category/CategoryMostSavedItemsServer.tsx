import CategorySectionTitle from './CategorySectionTitle';
import CategoryItemChipLink from './CategoryItemChipLink';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import type { CategoryItemCard } from '@/types/category-page';

type CategoryMostSavedItemsServerProps = {
  items: CategoryItemCard[];
  accentColor?: string;
  inset?: boolean;
};

export default function CategoryMostSavedItemsServer({
  items,
  accentColor = '#EA580C',
  inset = false,
}: CategoryMostSavedItemsServerProps) {
  if (items.length === 0) return null;

  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <CategorySectionTitle
        title="محبوب‌ترین آیتم‌ها"
        subtitle="بر اساس لایک و تعامل کاربران"
        icon="⭐"
      />

      <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {items.map((item) => (
          <CategoryItemChipLink key={item.id} item={item} accentColor={accentColor} />
        ))}
      </div>
    </section>
  );
}
