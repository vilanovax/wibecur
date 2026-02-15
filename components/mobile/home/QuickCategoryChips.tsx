'use client';

import Link from 'next/link';

const CHIPS: { slug: string; label: string; href?: string }[] = [
  { slug: 'movie', label: '🎬 فیلم' },
  { slug: 'book', label: '📚 کتاب' },
  { slug: 'cafe', label: '☕ کافه' },
  { slug: 'travel', label: '🌍 سفر' },
  { slug: 'podcast', label: '🌙 قبل خواب' },
  { slug: 'trending', label: '🔥 ترند', href: '/lists' },
];

export default function QuickCategoryChips() {
  return (
    <section className="px-4 py-2 pb-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1">
        {CHIPS.map((chip, i) => (
          <Link
            key={chip.slug}
            href={chip.href ?? (chip.slug ? `/categories/${chip.slug}` : '/lists')}
            className="flex-shrink-0 snap-start h-9 px-3.5 rounded-2xl bg-white border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:border-primary/30 active:scale-[0.98] transition-all whitespace-nowrap shadow-vibe-card flex items-center"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
