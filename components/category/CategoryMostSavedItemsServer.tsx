import CategorySectionTitle from './CategorySectionTitle';
import CategoryItemChipLink, {
  type CategoryItemChipLayout,
} from './CategoryItemChipLink';
import HorizontalScrollFade from '@/components/shared/HorizontalScrollFade';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import type { CategoryItemCard } from '@/types/category-page';

type CategoryMostSavedItemsServerProps = {
  items: CategoryItemCard[];
  accentColor?: string;
  inset?: boolean;
  itemLayout?: CategoryItemChipLayout;
};

export default function CategoryMostSavedItemsServer({
  items,
  accentColor = '#EA580C',
  inset = false,
  itemLayout = 'tile',
}: CategoryMostSavedItemsServerProps) {
  if (items.length === 0) return null;

  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <CategorySectionTitle
        title="محبوب‌ترین آیتم‌ها"
        subtitle="بر اساس لایک و تعامل کاربران"
        iconVariant="saved"
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
