'use client';

import type { CategoryFilterKind } from '@/lib/admin/categories-types';

const tabs: { value: CategoryFilterKind; label: string; color: string }[] = [
  { value: 'all', label: 'همه', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' },
  { value: 'healthy', label: 'سالم', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200' },
  { value: 'needs_boost', label: 'نیازمند Boost', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' },
  { value: 'declining', label: 'در حال افت', color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200' },
  { value: 'inactive', label: 'غیرفعال', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' },
];

interface CategoryFilterTabsProps {
  value: CategoryFilterKind;
  onChange: (value: CategoryFilterKind) => void;
}

export default function CategoryFilterTabs({ value, onChange }: CategoryFilterTabsProps) {
  return (
    <div
      className="inline-flex flex-wrap rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/80 p-1 gap-0.5"
      dir="rtl"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            value === tab.value
              ? tab.value === 'all'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : tab.color + ' shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
