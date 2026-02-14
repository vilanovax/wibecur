'use client';

import Link from 'next/link';
import type { CityBreakdown } from '@/types/category-page';
import { getRandomPlaceholderUrl } from '@/lib/placeholder-images';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { LOCATION_CITIES } from '@/types/category-page';

interface DiscoverByCityProps {
  cityBreakdown: CityBreakdown[];
  categorySlug: string;
  accentColor?: string;
}

function getCityImageUrl(city: string): string {
  return getRandomPlaceholderUrl(`city-${city}`, 'cover');
}

/** کارت‌های شهر — محبوب در هر شهر (همیشه نمایش برای عمق صفحه) */
export default function DiscoverByCity({
  cityBreakdown,
  categorySlug,
  accentColor = '#EA580C',
}: DiscoverByCityProps) {
  const cityMap = Object.fromEntries(cityBreakdown.map((c) => [c.city, c.listCount]));
  const citiesToShow =
    cityBreakdown.length > 0
      ? cityBreakdown.map((c) => ({ city: c.city, listCount: c.listCount }))
      : LOCATION_CITIES.map((city) => ({ city, listCount: cityMap[city] ?? 0 }));

  return (
    <section className="px-4 py-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
        📍 محبوب در شهرها
      </h2>
      <p className="text-[11px] text-gray-500">
        کشف لیست‌های محبوب در هر شهر
      </p>

      <div className="grid grid-cols-2 gap-2.5 mt-2">
        {citiesToShow.map(({ city, listCount }) => {
          const img = getCityImageUrl(city);
          return (
            <Link
              key={city}
              href={`/lists?category=${categorySlug}&tag=${encodeURIComponent(city)}`}
              className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100 active:scale-[0.98] transition-transform shadow-sm"
            >
              <ImageWithFallback
                src={img}
                alt={city}
                className="w-full h-full object-cover"
                placeholderSize="cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-bold text-white text-base">{city}</p>
                <p className="text-xs text-white/90">
                  {listCount} لیست فعال
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
