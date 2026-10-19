'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getCategoryCoverUrl } from '@/lib/category-cover-images';
import type { CuratedCategory } from '@/types/curated';
import ExploreSectionTitle from './ExploreSectionTitle';

interface CategoryDiscoverySectionProps {
  categories: CuratedCategory[];
}

export default function CategoryDiscoverySection({ categories }: CategoryDiscoverySectionProps) {
  const displayCats = categories.filter((c) => c.id !== 'all').slice(0, 6);

  if (displayCats.length === 0) return null;

  return (
    <section
      id="categories"
      className="border-t border-wibe/60 px-2.5 py-4 lg:px-0 lg:py-5"
      aria-labelledby="categories-title"
    >
      <ExploreSectionTitle
        id="categories-title"
        title="بر اساس موضوع"
        subtitle="اگر می‌دونی دنبال چی می‌گردی"
        icon="📁"
      />

      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6 lg:gap-3">
        {displayCats.map((cat) => {
          const slug = cat.slug ?? cat.id;
          const cover = getCategoryCoverUrl(slug);
          return (
            <Link
              key={cat.id}
              href={`/categories/${slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] lg:aspect-[5/4] lg:hover:border-primary/25"
            >
              <ImageWithFallback
                src={cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                fallbackIcon={cat.icon}
                fallbackClassName="absolute inset-0 flex items-center justify-center bg-wibe-surface text-2xl"
                sizes="(min-width: 1024px) 16vw, 33vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 p-2 text-center lg:p-2.5">
                <span className="mb-0.5 block text-base leading-none lg:text-lg" aria-hidden>
                  {cat.icon}
                </span>
                <span className="line-clamp-2 wibe-caption font-semibold leading-tight text-white">
                  {cat.title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/categories"
        className="mt-3 flex w-full items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.04] py-2.5 wibe-caption font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:mt-3.5 lg:inline-flex lg:w-auto lg:px-6"
      >
        مشاهده همه دسته‌ها
      </Link>
    </section>
  );
}
