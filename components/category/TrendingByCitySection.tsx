'use client';

import { useState } from 'react';
import type { CategoryListCard } from '@/types/category-page';
import { LOCATION_CITIES } from '@/types/category-page';
import CategoryListCardImproved from './CategoryListCardImproved';
import CategorySectionTitle from './CategorySectionTitle';

interface TrendingByCitySectionProps {
  allLists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

export default function TrendingByCitySection({
  allLists,
  accentColor = '#6366F1',
}: TrendingByCitySectionProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const filtered = selectedCity
    ? allLists.filter(
        (l) =>
          l.cityTag === selectedCity ||
          l.title.includes(selectedCity) ||
          (l.tags && l.tags.some((t) => t.includes(selectedCity)))
      )
    : allLists.slice(0, 6);

  return (
    <section className="px-4 py-6">
      <CategorySectionTitle title="ترند بر اساس شهر" icon="📍" />

      <div className="flex gap-2 mt-1 overflow-x-auto pb-2 scrollbar-hide">
        {LOCATION_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => setSelectedCity(selectedCity === city ? null : city)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg wibe-small font-medium transition-colors ${
              selectedCity === city
                ? 'bg-primary text-white shadow-sm'
                : 'bg-wibe-card text-wibe-secondary border border-wibe'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length > 0 ? (
          filtered.map((list) => (
            <CategoryListCardImproved key={list.id} list={list} accentColor={accentColor} />
          ))
        ) : (
          <p className="wibe-small text-wibe-secondary py-4 text-center">
            لیستی برای {selectedCity} یافت نشد
          </p>
        )}
      </div>
    </section>
  );
}
