'use client';

import Link from 'next/link';

interface CuratorCTABlockProps {
  categorySlug: string;
}

/** بلاک CTA — منتقد بعدی وایب */
export default function CuratorCTABlock({ categorySlug }: CuratorCTABlockProps) {
  return (
    <section className="px-4 pb-8 lg:px-0 lg:pb-6">
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800 p-6 text-center lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-8 lg:text-right">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white lg:text-2xl">
            🎬 منتقد بعدی وایب تویی؟
          </h2>
          <p className="text-gray-300 mt-2 text-sm lg:mt-2.5 lg:text-base">
            لیست فیلم بساز، امتیاز بگیر، رشد کن.
          </p>
        </div>
        <Link
          href={`/lists?category=${categorySlug}&create=1`}
          className="mt-5 inline-flex items-center justify-center w-full max-w-xs py-3.5 px-6 rounded-xl font-bold text-base bg-amber-400 hover:bg-amber-500 text-gray-900 shadow-md transition-all active:scale-[0.98] lg:mt-0 lg:w-auto lg:shrink-0 lg:min-w-[180px]"
        >
          ساخت لیست
        </Link>
      </div>
    </section>
  );
}
