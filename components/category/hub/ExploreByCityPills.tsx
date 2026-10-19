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
        iconVariant="location"
      />

      <div className="flex flex-wrap gap-2">
        {LOCATION_CITIES.map((city) => (
          <Link
            key={city}
            href={`/lists?category=${categorySlug}&tag=${encodeURIComponent(city)}`}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-popover px-4 text-sm font-medium text-foreground transition-transform active:scale-[0.98]"
          >
            <span>{city}</span>
            {cityCounts[city] != null && cityCounts[city] > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {cityCounts[city].toLocaleString('fa-IR')}
              </span>
            )}
          </Link>
        ))}
        <Link
          href={`/lists?category=${categorySlug}`}
          className="inline-flex h-11 items-center gap-1 rounded-full bg-brand px-4 text-sm font-semibold text-brand-foreground"
        >
          همه شهرها
        </Link>
      </div>
    </section>
  );
}
