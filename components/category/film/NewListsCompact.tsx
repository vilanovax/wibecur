'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from '../CategorySectionTitle';
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
        icon="🆕"
      />

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-3 p-3 rounded-xl bg-wibe-card border border-wibe shadow-sm active:scale-[0.99] transition-all lg:p-4 lg:rounded-2xl lg:hover:border-primary/20 lg:hover:shadow-md"
          >
            <div className="w-14 h-20 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden lg:w-[72px] lg:h-[104px]">
              {list.coverImage ? (
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  placeholderSize="square"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-50 bg-gray-200">
                  🎬
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <h3 className="wibe-small font-semibold text-foreground line-clamp-2 lg:text-[15px]">
                {list.title}
              </h3>
              <p className="wibe-caption text-wibe-secondary mt-0.5 lg:mt-1">
                {list.creator?.name || 'کیوریتور'}
              </p>
              <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="compact" className="mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
