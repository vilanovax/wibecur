'use client';

import Link from 'next/link';
import { LOCATION_CITIES } from '@/types/category-page';
import CategorySectionTitle from '../CategorySectionTitle';

import { CATEGORY_SECTION } from '@/lib/category-layout';

interface ExploreByCityPillsProps {
  categorySlug: string;
  cityCounts?: Record<string, number>;
  accentColor?: string;
  inset?: boolean;
}

export default function ExploreByCityPills({
  categorySlug,
  cityCounts = {},
  inset = false,
}: ExploreByCityPillsProps) {
  const sectionClass = `${CATEGORY_SECTION} scroll-mt-4 ${inset ? '' : 'px-4'}`;

  return (
    <section id="explore-by-city" className={sectionClass}>
      <CategorySectionTitle
        title="محبوب‌ترین‌ها در شهرها"
        subtitle="کشف لیست‌ها بر اساس شهر"
        icon="📍"
      />

      <div className="flex flex-wrap gap-2">
        {LOCATION_CITIES.map((city) => (
          <Link
            key={city}
            href={`/lists?category=${categorySlug}&tag=${encodeURIComponent(city)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg wibe-small font-medium border border-wibe bg-wibe-card shadow-sm active:scale-[0.98] transition-transform"
          >
            <span>{city}</span>
            {cityCounts[city] != null && cityCounts[city] > 0 && (
              <span className="wibe-caption font-medium text-wibe-secondary bg-gray-100 px-1.5 py-0.5 rounded-pill">
                {cityCounts[city]}
              </span>
            )}
          </Link>
        ))}
        <Link
          href={`/lists?category=${categorySlug}`}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg wibe-small font-semibold text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          همه شهرها
        </Link>
      </div>
    </section>
  );
}
