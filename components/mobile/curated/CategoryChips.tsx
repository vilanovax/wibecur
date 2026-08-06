'use client';

import type { CuratedCategory } from '@/types/curated';

interface CategoryChipsProps {
  categories: CuratedCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  count?: number;
}

const CHIP_BASE =
  'flex items-center gap-1.5 h-9 px-3.5 rounded-lg wibe-small font-medium whitespace-nowrap flex-shrink-0 transition-colors active:scale-[0.98]';

function chipClass(isSelected: boolean) {
  return isSelected
    ? `${CHIP_BASE} bg-primary text-white shadow-sm`
    : `${CHIP_BASE} bg-wibe-card border border-wibe text-foreground shadow-sm hover:border-primary/30`;
}

export default function CategoryChips({
  categories,
  selectedId,
  onSelect,
  count,
}: CategoryChipsProps) {
  return (
    <div className="px-4 py-3 bg-wibe-surface">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide min-w-0 -mx-1 px-1">
          {categories.map((cat) => {
            const isSelected = selectedId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className={chipClass(isSelected)}
                aria-pressed={isSelected}
              >
                <span aria-hidden="true">{cat.icon}</span>
                {cat.title}
              </button>
            );
          })}
        </div>
        {count !== undefined && (
          <span className="wibe-caption text-wibe-secondary flex-shrink-0">
            {count.toLocaleString('fa-IR')} لیست
          </span>
        )}
      </div>
    </div>
  );
}
