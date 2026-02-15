'use client';

import type { CuratedCategory } from '@/types/curated';

interface CategoryChipsProps {
  categories: CuratedCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  count?: number;
}

export default function CategoryChips({
  categories,
  selectedId,
  onSelect,
  count,
}: CategoryChipsProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide min-w-0">
          {categories.map((cat) => {
            const isSelected = selectedId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-pressed={isSelected}
              >
                <span aria-hidden="true">{cat.icon}</span>
                {cat.title}
              </button>
            );
          })}
        </div>
        {count !== undefined && (
          <span className="text-[12px] text-gray-500 flex-shrink-0">
            {count.toLocaleString('fa-IR')} لیست
          </span>
        )}
      </div>
    </div>
  );
}
