'use client';

import { useState } from 'react';
import HorizontalScrollFade from '@/components/shared/HorizontalScrollFade';

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
    <div className="sticky top-[57px] z-10 -mx-4 border-b border-wibe bg-wibe-surface px-4 pb-2">
      <HorizontalScrollFade
        surface="surface"
        innerClassName="flex gap-2 py-3 -mx-1"
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleClick(f.id)}
            className={`wibe-chip ${current === f.id ? 'wibe-chip-active' : 'wibe-chip-inactive'}`}
          >
            {f.label}
          </button>
        ))}
      </HorizontalScrollFade>
    </div>
  );
}
