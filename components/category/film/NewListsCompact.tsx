'use client';

import CategorySectionTitle from '../CategorySectionTitle';
import ListRowCompact from '@/components/shared/ListRowCompact';
import type { CategoryListCard } from '@/types/category-page';
import { FILM_SECTION } from './film-layout';

interface NewListsCompactProps {
  lists: CategoryListCard[];
  categoryName: string;
}

export default function NewListsCompact({
  lists,
  categoryName,
}: NewListsCompactProps) {
  if (lists.length === 0) return null;

  return (
    <section className={FILM_SECTION}>
      <CategorySectionTitle
        title="لیست‌های جدید"
        subtitle={`تازه‌ترین لیست‌های ${categoryName}`}
        iconVariant="new"
      />

      <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {lists.map((list) => (
          <ListRowCompact
            key={list.id}
            list={list}
            thumb="poster"
            showCreator={false}
            showSaveCount={false}
          />
        ))}
      </div>
    </section>
  );
}
