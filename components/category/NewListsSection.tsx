'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
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
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <span>🆕</span>
        لیست‌های جدید {categoryName}
      </h2>
      <p className="text-sm text-gray-500 mt-0.5">
        تازه‌ترین لیست‌های ساخته شده
      </p>
      <div className="space-y-3 mt-4">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
              {list.coverImage ? (
                <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover"
                  />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-40">
                  📋
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                {list.title}
              </h3>
              {list.creator?.name && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {list.creator.name}
                </p>
              )}
              <div className="flex gap-3 mt-1 text-xs text-gray-400">
                <span>{list.itemCount} آیتم</span>
                <span>•</span>
                <span>{list.saveCount} ذخیره</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
