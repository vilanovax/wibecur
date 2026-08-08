'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryListCard } from '@/types/category-page';

interface FilmNewListsSectionProps {
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

/** لیست‌های جدید — تم تیره سینمایی */
export default function FilmNewListsSection({
  lists,
  categoryName,
  accentColor = '#A855F7',
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
            className="flex gap-4 p-4 rounded-2xl bg-gray-900 border border-gray-800 active:scale-[0.99] transition-transform"
          >
            <div className="w-20 h-28 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden">
              {list.coverImage ? (
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  placeholderSize="cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl opacity-50"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  🎬
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white/90 text-base line-clamp-2">
                {list.title}
              </h3>
              {list.creator?.name && (
                <p className="text-sm text-white/65 mt-1">{list.creator.name}</p>
              )}
              <div className="flex gap-3 mt-2 text-sm text-wibe-secondary">
                <span>⭐ {list.saveCount}</span>
                <span>•</span>
                <span>❤️ {list.likeCount}</span>
                <span>•</span>
                <span>{list.itemCount} آیتم</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
