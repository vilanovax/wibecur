'use client';

import Link from 'next/link';

interface CafeCTABlockProps {
  categorySlug: string;
  accentColor?: string;
}

/** CTA Smart — کارت نهایی کافه */
export default function CafeCTABlock({
  categorySlug,
  accentColor = '#EA580C',
}: CafeCTABlockProps) {
  return (
    <section className="px-4 py-8">
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)`,
          border: `2px solid ${accentColor}40`,
          boxShadow: `0 8px 24px ${accentColor}20`,
        }}
      >
        <h3 className="text-xl font-bold text-gray-900">
          لیست خودت رو بساز
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          اولین کسی باش که بهترین کافه‌های شهر رو معرفی می‌کنه
        </p>
        <Link
          href={`/lists?category=${categorySlug}&create=1`}
          className="mt-5 inline-flex items-center justify-center w-full max-w-xs py-4 px-6 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] shadow-lg mx-auto"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            boxShadow: `0 4px 20px ${accentColor}60`,
          }}
        >
          ✨ ساخت لیست
        </Link>
      </div>
    </section>
  );
}
