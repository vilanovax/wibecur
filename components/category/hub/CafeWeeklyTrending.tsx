'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from '../CategorySectionTitle';
import type { CategoryListCard } from '@/types/category-page';

interface CafeWeeklyTrendingProps {
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

export default function CafeWeeklyTrending({
  lists,
  categoryName,
}: CafeWeeklyTrendingProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <CategorySectionTitle
        title={`داغ‌ترین لیست‌های هفته در ${categoryName}`}
        subtitle="بر اساس ذخیره"
        iconVariant="trending"
      />
      <div className="grid grid-cols-2 gap-3">
        {lists.slice(0, 6).map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="block rounded-lg overflow-hidden bg-wibe-card border border-wibe shadow-card active:scale-[0.99] transition-transform"
          >
            <div className="relative aspect-[3/4] bg-wibe-surface">
              {list.coverImage ? (
                <ImageWithFallback
                  src={list.coverImage}
                  alt={list.title}
                  className="w-full h-full object-cover"
                  placeholderSize="cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-40 bg-wibe-surface">
                  ☕
                </div>
              )}
              <span className="absolute top-2 right-2 wibe-caption font-semibold text-white px-2 py-0.5 rounded-pill bg-warning">
                ترند
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <h3 className="wibe-small font-semibold text-white line-clamp-2">{list.title}</h3>
                <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="overlay" className="mt-1" />
                {list.creator?.name && (
                  <p className="wibe-caption text-white/80 mt-1 truncate">{list.creator.name}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
