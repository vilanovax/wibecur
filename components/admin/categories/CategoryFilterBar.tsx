'use client';

import type { CategoryFilterKind } from '@/lib/admin/categories-types';

const pills: { value: CategoryFilterKind; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'growing', label: 'در حال رشد' },
  { value: 'low_engagement', label: 'کم‌تعامل' },
  { value: 'needs_review', label: 'نیازمند بررسی' },
  { value: 'inactive', label: 'غیرفعال' },
];

interface CategoryFilterBarProps {
  value: CategoryFilterKind;
  onChange: (value: CategoryFilterKind) => void;
}

export default function CategoryFilterBar({ value, onChange }: CategoryFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            value === p.value
              ? 'bg-[var(--primary)] text-white shadow-sm'
              : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
