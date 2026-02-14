'use client';

import Link from 'next/link';

interface BottomCTABlockProps {
  categorySlug: string;
  categoryName: string;
  accentColor?: string;
}

/** CTA بزرگ انتهای صفحه — engagement hook */
export default function BottomCTABlock({
  categorySlug,
  categoryName,
  accentColor = '#EA580C',
}: BottomCTABlockProps) {
  return (
    <section className="px-4 py-5">
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`,
          border: `1px solid ${accentColor}35`,
          boxShadow: `0 4px 20px ${accentColor}15`,
        }}
      >
        <h3 className="text-lg font-bold text-gray-900">
          لیست خودت رو بساز و دیده شو
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          کیوریتورهای برتر از همین‌جا شروع کردند
        </p>
        <Link
          href={`/lists?category=${categorySlug}&create=1`}
          className="mt-5 inline-flex items-center justify-center w-full max-w-xs py-4 px-6 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] shadow-lg mx-auto"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 4px 16px ${accentColor}50`,
          }}
        >
          ✨ ساخت لیست
        </Link>
      </div>
    </section>
  );
}
