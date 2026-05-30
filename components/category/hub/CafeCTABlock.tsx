'use client';

import Link from 'next/link';
import CategorySectionTitle from '../CategorySectionTitle';

interface CafeCTABlockProps {
  categorySlug: string;
  accentColor?: string;
}

export default function CafeCTABlock({ categorySlug }: CafeCTABlockProps) {
  return (
    <section className="px-4 py-6">
      <div className="rounded-lg p-5 text-center bg-wibe-card border border-wibe shadow-sm">
        <CategorySectionTitle title="لیست خودت رو بساز" subtitle="اولین کسی باش که بهترین‌های شهر رو معرفی می‌کنه" />
        <Link
          href={`/lists?category=${categorySlug}&create=1`}
          className="mt-4 inline-flex items-center justify-center w-full max-w-xs py-3 px-6 rounded-md wibe-small font-semibold text-white bg-primary hover:bg-primary-dark transition-colors mx-auto"
        >
          ساخت لیست
        </Link>
      </div>
    </section>
  );
}
