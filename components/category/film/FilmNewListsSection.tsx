'use client';

import Link from 'next/link';
import ListCategoryIconTile from '@/components/shared/ListCategoryIconTile';
import type { CategoryListCard } from '@/types/category-page';
import { fa } from '@/lib/utils';

interface FilmNewListsSectionProps {
  lists: CategoryListCard[];
  categoryName: string;
  categoryIcon?: string | null;
  accentColor?: string;
}

/** لیست‌های جدید — تم تیره سینمایی */
export default function FilmNewListsSection({
  lists,
  categoryName,
  categoryIcon = '🎬',
}: FilmNewListsSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        🆕 لیست‌های جدید
      </h2>
      <p className="text-sm text-wibe-secondary mt-0.5 mb-5">
        تازه‌ترین لیست‌های {categoryName}
      </p>

      <div className="space-y-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-4 transition-transform active:scale-[0.99]"
          >
            <ListCategoryIconTile
              icon={categoryIcon}
              size="lg"
              className="bg-gray-800"
            />
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-base font-semibold text-white/90">
                {list.title}
              </h3>
              {list.creator?.name && (
                <p className="mt-1 text-sm text-white/65">{list.creator.name}</p>
              )}
              <div className="mt-2 flex gap-3 text-sm text-wibe-secondary">
                <span>⭐ {fa(list.saveCount)}</span>
                <span>•</span>
                <span>❤️ {fa(list.likeCount)}</span>
                <span>•</span>
                <span>{fa(list.itemCount)} آیتم</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
