'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from '../CategorySectionTitle';
import type { CategoryListCard } from '@/types/category-page';
import { FILM_SECTION } from './film-layout';

interface TrendingPosterGridProps {
  lists: CategoryListCard[];
  categorySlug: string;
}

export default function TrendingPosterGrid({
  lists,
  categorySlug,
}: TrendingPosterGridProps) {
  if (lists.length === 0) return null;

  return (
    <section className={FILM_SECTION}>
      <div className="flex items-end justify-between gap-3 mb-3 lg:mb-4">
        <CategorySectionTitle
          title="داغ‌ترین لیست‌های هفته"
          subtitle="بر اساس ذخیره"
          icon="🔥"
          className="mb-0"
        />
        <Link
          href={`/lists?category=${categorySlug}`}
          className="inline-flex shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary-dark pb-0.5"
        >
          مشاهده همه
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
        {lists.slice(0, 8).map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="group block active:scale-[0.99] transition-transform lg:hover:-translate-y-0.5"
          >
            <div className="relative rounded-xl overflow-hidden bg-wibe-card border border-wibe shadow-card lg:rounded-2xl lg:shadow-sm lg:group-hover:shadow-lg lg:transition-shadow">
              <div className="relative aspect-[2/3] bg-gray-800 lg:aspect-[3/4]">
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover lg:group-hover:scale-[1.03] lg:transition-transform lg:duration-300"
                    placeholderSize="square"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl opacity-50 bg-gray-800">
                    🎬
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent lg:from-black/80" />
                {(list.badge === 'viral' || list.badge === 'hot') && (
                  <span className="absolute top-2 right-2 wibe-caption font-semibold text-white px-2 py-0.5 rounded-pill bg-warning">
                    ترند
                  </span>
                )}
                <div className="absolute bottom-2 left-2 right-2 lg:bottom-3 lg:left-3 lg:right-3">
                  <h3 className="wibe-small font-semibold text-white line-clamp-2 lg:text-[15px] lg:leading-snug">
                    {list.title}
                  </h3>
                  <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="overlay" className="mt-1" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
