'use client';

import Link from 'next/link';
import type { CuratedCategory } from '@/types/curated';
import ExploreSectionTitle from './ExploreSectionTitle';

interface CategoryDiscoverySectionProps {
  categories: CuratedCategory[];
}

export default function CategoryDiscoverySection({ categories }: CategoryDiscoverySectionProps) {
  const displayCats = categories.filter((c) => c.id !== 'all').slice(0, 8);

  if (displayCats.length === 0) return null;

  return (
    <section id="categories" className="px-2.5 py-4" aria-labelledby="categories-title">
      <ExploreSectionTitle
        id="categories-title"
        title="کشف دسته‌ها"
        subtitle="لیست‌ها را بر اساس موضوع پیدا کن"
        icon="🗂"
      />

      <div className="scrollbar-hide -mx-2.5 flex gap-2 overflow-x-auto px-2.5 pb-1">
        {displayCats.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug ?? cat.id}`}
            className="flex h-[72px] w-[88px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-wibe bg-wibe-card px-2 shadow-sm transition-transform active:scale-[0.98]"
          >
            <span className="text-xl leading-none" aria-hidden>
              {cat.icon}
            </span>
            <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-foreground">
              {cat.title}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/categories"
        className="mt-2.5 block rounded-xl border border-wibe bg-wibe-surface py-2.5 text-center wibe-caption font-semibold text-primary transition-transform active:scale-[0.99]"
      >
        مشاهده همه دسته‌ها
      </Link>
    </section>
  );
}
