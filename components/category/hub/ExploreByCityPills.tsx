'use client';

import Link from 'next/link';
import { LOCATION_CITIES } from '@/types/category-page';

interface ExploreByCityPillsProps {
  categorySlug: string;
  cityCounts?: Record<string, number>;
  accentColor?: string;
}

/** پیل‌های شهر — Explore by City */
export default function ExploreByCityPills({
  categorySlug,
  cityCounts = {},
  accentColor = '#EA580C',
}: ExploreByCityPillsProps) {
  return (
    <section id="explore-by-city" className="px-4 py-8 scroll-mt-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        📍 محبوب‌ترین‌ها در شهرها
      </h2>
      <p className="text-[11px] text-gray-500 mb-3">
        کشف لیست‌ها بر اساس شهر
      </p>

      <div className="flex flex-wrap gap-2">
        {LOCATION_CITIES.map((city) => (
          <Link
            key={city}
            href={`/lists?category=${categorySlug}&tag=${encodeURIComponent(city)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.97] shadow-md border border-gray-200/80 bg-white hover:border-orange-200"
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <span>{city}</span>
            {cityCounts[city] != null && cityCounts[city] > 0 && (
              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {cityCounts[city]}
              </span>
            )}
          </Link>
        ))}
        <Link
          href={`/lists?category=${categorySlug}`}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.97] text-white"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 2px 10px ${accentColor}50`,
          }}
        >
          + همه شهرها
        </Link>
      </div>
    </section>
  );
}
