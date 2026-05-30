'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from './CategorySectionTitle';
import type { CategoryListCard } from '@/types/category-page';

interface NewListsSectionProps {
  lists: CategoryListCard[];
  categoryName: string;
}

export default function NewListsSection({
  lists,
  categoryName,
}: NewListsSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <CategorySectionTitle
        title={`لیست‌های جدید ${categoryName}`}
        subtitle="تازه‌ترین لیست‌های ساخته شده"
        icon="🆕"
      />
      <div className="space-y-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-3 p-3 rounded-lg bg-wibe-card border border-wibe shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="w-16 h-16 rounded-md bg-gray-200 flex-shrink-0 overflow-hidden">
              {list.coverImage ? (
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-40 bg-gray-200">
                  📋
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
              {list.creator?.name && (
                <p className="wibe-caption text-wibe-secondary mt-0.5">{list.creator.name}</p>
              )}
              <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="compact" className="mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
