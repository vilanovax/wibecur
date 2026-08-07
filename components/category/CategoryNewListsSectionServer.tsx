import CategorySectionTitle from './CategorySectionTitle';
import ListRowCompact from '@/components/shared/ListRowCompact';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import type { CategoryListCard } from '@/types/category-page';

type CategoryNewListsSectionServerProps = {
  lists: CategoryListCard[];
  categoryName: string;
  inset?: boolean;
};

export default function CategoryNewListsSectionServer({
  lists,
  categoryName,
  inset = false,
}: CategoryNewListsSectionServerProps) {
  if (lists.length === 0) return null;

  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <CategorySectionTitle
        title={`لیست‌های جدید ${categoryName}`}
        subtitle="تازه‌ترین لیست‌های ساخته شده"
        iconVariant="new"
      />
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {lists.map((list) => (
          <ListRowCompact
            key={list.id}
            list={list}
            thumb="square"
            showCreator={false}
            showSaveCount={false}
          />
        ))}
      </div>
    </section>
  );
}
