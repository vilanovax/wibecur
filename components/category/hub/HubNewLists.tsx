'use client';

import CategorySectionTitle from '../CategorySectionTitle';
import ListRowCompact from '@/components/shared/ListRowCompact';
import type { CategoryListCard } from '@/types/category-page';

interface HubNewListsProps {
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

export default function HubNewLists({
  lists,
  categoryName,
}: HubNewListsProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <CategorySectionTitle
        title="لیست‌های جدید"
        subtitle={`تازه‌ترین لیست‌های ${categoryName}`}
        iconVariant="new"
      />

      <div className="space-y-2">
        {lists.map((list) => (
          <ListRowCompact
            key={list.id}
            list={list}
            thumb="square"
            className="p-2.5"
            showCreator={false}
            showSaveCount={false}
          />
        ))}
      </div>
    </section>
  );
}
