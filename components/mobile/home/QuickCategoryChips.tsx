'use client';

import Link from 'next/link';

const CHIPS: { slug: string; label: string; href?: string }[] = [
  { slug: 'movie', label: '🎬 فیلم' },
  { slug: 'book', label: '📚 کتاب' },
  { slug: 'cafe', label: '☕ کافه' },
  { slug: 'travel', label: '🌍 سفر' },
  { slug: 'podcast', label: '🌙 قبل خواب' },
  { slug: 'all-categories', label: '📂 همه دسته‌ها', href: '/categories' },
];

export default function QuickCategoryChips() {
  return (
    <section
      className="px-4 py-2 pb-3 lg:border-b lg:border-wibe/60 lg:px-0 lg:py-3 lg:pb-4"
      aria-label="دسته‌های سریع"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1 lg:mx-0 lg:flex-wrap lg:justify-start lg:gap-2 lg:overflow-visible">
        {CHIPS.map((chip) => (
          <Link
            key={chip.slug}
            href={chip.href ?? `/categories/${chip.slug}`}
            className="flex h-9 flex-shrink-0 snap-start items-center whitespace-nowrap rounded-lg border border-wibe bg-wibe-card px-3.5 wibe-small font-medium text-foreground shadow-sm transition-all hover:border-primary/30 active:scale-[0.98] lg:h-8 lg:bg-wibe-surface lg:px-3 lg:py-0 lg:wibe-caption"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
