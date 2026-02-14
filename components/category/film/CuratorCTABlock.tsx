'use client';

import Link from 'next/link';

interface CuratorCTABlockProps {
  categorySlug: string;
}

/** بلاک CTA تاریک — منتقد بعدی وایب */
export default function CuratorCTABlock({ categorySlug }: CuratorCTABlockProps) {
  return (
    <section className="mx-4 mb-8 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm p-6 text-center">
      <h2 className="text-xl font-bold text-gray-900">
        🎬 منتقد بعدی وایب تویی؟
      </h2>
      <p className="text-gray-600 mt-2 text-sm">
        لیست فیلم بساز، امتیاز بگیر، رشد کن.
      </p>
      <Link
        href={`/lists?category=${categorySlug}&create=1`}
        className="mt-5 inline-flex items-center justify-center w-full max-w-xs py-3.5 px-6 rounded-xl font-bold text-base bg-amber-400 hover:bg-amber-500 text-gray-900 shadow-md transition-all active:scale-[0.98]"
      >
        ساخت لیست
      </Link>
    </section>
  );
}
