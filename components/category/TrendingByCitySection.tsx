'use client';

import { useState } from 'react';
import type { CategoryListCard } from '@/types/category-page';
import { LOCATION_CITIES } from '@/types/category-page';
import CategoryListCardImproved from './CategoryListCardImproved';

interface TrendingByCitySectionProps {
  allLists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
}

export default function TrendingByCitySection({
  allLists,
  categoryName,
  accentColor = '#EA580C',
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
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span>📍</span>
        ترند بر اساس شهر
      </h2>
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
        {LOCATION_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => setSelectedCity(selectedCity === city ? null : city)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCity === city
                ? 'text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/30'
            }`}
            style={selectedCity === city ? { backgroundColor: accentColor } : {}}
          >
            {city}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {filtered.length > 0 ? (
          filtered.map((list) => (
            <CategoryListCardImproved
              key={list.id}
              list={list}
              accentColor={accentColor}
            />
          ))
        ) : (
          <p className="text-gray-500 text-sm py-4 text-center">
            لیستی برای {selectedCity} یافت نشد
          </p>
        )}
      </div>
    </section>
  );
}
