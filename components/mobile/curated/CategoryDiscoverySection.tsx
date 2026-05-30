'use client';

import Link from 'next/link';
import type { CuratedCategory } from '@/types/curated';
import ExploreSectionTitle from './ExploreSectionTitle';

interface CategoryDiscoverySectionProps {
  categories: CuratedCategory[];
}

export default function CategoryDiscoverySection({
  categories,
}: CategoryDiscoverySectionProps) {
  const displayCats = categories.filter((c) => c.id !== 'all').slice(0, 6);

  if (displayCats.length === 0) return null;

  return (
    <section
      id="categories"
      className="px-4 py-6 border-t border-wibe"
      aria-labelledby="categories-title"
    >
      <ExploreSectionTitle
        id="categories-title"
        title="کشف دسته‌ها"
        subtitle="لیست‌ها را بر اساس موضوع پیدا کن"
      />
      <div className="grid grid-cols-3 gap-2.5">
        {displayCats.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug ?? cat.id}`}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-wibe bg-wibe-card shadow-sm active:scale-[0.98] transition-transform aspect-square"
          >
            <span className="text-2xl leading-none" aria-hidden>
              {cat.icon}
            </span>
            <span className="wibe-caption font-medium text-foreground text-center line-clamp-2 px-0.5">
              {cat.title}
            </span>
          </Link>
        ))}
      </div>
      <Link
        href="/lists"
        className="mt-4 block w-full py-3 px-4 rounded-md border border-wibe bg-wibe-card wibe-small font-semibold text-primary text-center active:scale-[0.99] transition-transform"
      >
        مشاهده همه دسته‌ها
      </Link>
    </section>
  );
}
