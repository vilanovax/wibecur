'use client';

import { useState } from 'react';

export type CategoryFilter = 'newest' | 'viral' | 'saves' | 'nearby' | 'cheap' | 'luxury' | 'outdoor';

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'newest', label: 'جدید' },
  { id: 'viral', label: 'وایرال' },
  { id: 'saves', label: 'بیشترین ذخیره' },
  { id: 'nearby', label: 'نزدیک من' },
  { id: 'cheap', label: 'ارزان' },
  { id: 'luxury', label: 'لوکس' },
  { id: 'outdoor', label: 'فضای باز' },
];

interface CategoryFilterBarProps {
  activeFilter?: CategoryFilter;
  onFilterChange?: (filter: CategoryFilter) => void;
}

export default function CategoryFilterBar({
  activeFilter = 'newest',
  onFilterChange,
}: CategoryFilterBarProps) {
  const [current, setCurrent] = useState<CategoryFilter>(activeFilter);

  const handleClick = (id: CategoryFilter) => {
    setCurrent(id);
    onFilterChange?.(id);
  };

  return (
    <div className="sticky top-[57px] z-10 bg-gray-50 pb-2 -mx-4 px-4 border-b border-gray-100">
      <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide -mx-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleClick(f.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              current === f.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
