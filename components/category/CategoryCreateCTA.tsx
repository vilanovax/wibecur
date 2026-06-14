'use client';

import Link from 'next/link';
import CategorySectionTitle from './CategorySectionTitle';

interface CategoryCreateCTAProps {
  categorySlug: string;
  categoryName: string;
}

export default function CategoryCreateCTA({ categorySlug, categoryName }: CategoryCreateCTAProps) {
  return (
    <section className="py-5 lg:py-6">
      <div className="rounded-2xl border border-wibe bg-wibe-card p-5 text-center shadow-sm lg:flex lg:items-center lg:justify-between lg:gap-6 lg:p-6 lg:text-right">
        <CategorySectionTitle
          className="mb-0 lg:mb-0 lg:text-right"
          title="لیست خودت رو بساز"
          subtitle={`اولین کیوریتور ${categoryName} باش`}
        />
        <Link
          href={`/lists?category=${categorySlug}&create=1`}
          className="mt-4 inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-primary px-6 py-3 wibe-small font-semibold text-white transition-colors hover:bg-primary-dark lg:mt-0 lg:w-auto lg:shrink-0"
        >
          ساخت لیست
        </Link>
      </div>
    </section>
  );
}
