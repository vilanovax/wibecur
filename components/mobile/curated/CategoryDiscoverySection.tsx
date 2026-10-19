'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { CuratedCategory } from '@/types/curated';
import ExploreSectionTitle from './ExploreSectionTitle';

interface CategoryDiscoverySectionProps {
  categories: CuratedCategory[];
}

export default function CategoryDiscoverySection({ categories }: CategoryDiscoverySectionProps) {
  const displayCats = categories.filter((c) => c.id !== 'all').slice(0, 8);

  if (displayCats.length === 0) return null;

  return (
    <section
      id="categories"
      className="border-t border-wibe/50 px-3.5 py-5 lg:px-0 lg:py-6"
      aria-labelledby="categories-title"
    >
      <ExploreSectionTitle
        id="categories-title"
        title="بر اساس موضوع بگرد"
        subtitle="اگر می‌دونی دنبال چی می‌گردی"
        icon="🗂"
      />

      <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:px-0 xl:grid-cols-6">
        {displayCats.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug ?? cat.id}`}
            className="flex w-[4.75rem] shrink-0 flex-col items-center gap-2 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] lg:w-full"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-wibe bg-wibe-card text-2xl shadow-sm ring-1 ring-black/[0.02] transition-colors hover:border-primary/30 lg:h-16 lg:w-16 lg:text-3xl">
              <span aria-hidden>{cat.icon}</span>
            </span>
            <span className="line-clamp-2 text-center wibe-caption font-medium leading-tight text-foreground lg:wibe-small">
              {cat.title}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/categories"
        className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full border border-primary/25 bg-primary/[0.04] px-4 py-2.5 wibe-caption font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:mt-4 lg:w-auto lg:px-5"
      >
        مشاهده همه دسته‌ها
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
}
