'use client';

import { TrendingUp, List, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { CategoryIntelligenceCard as CategoryIntelligenceCardType } from '@/lib/admin/types';

interface CategoryIntelligenceGridProps {
  categories: CategoryIntelligenceCardType[];
}

export default function CategoryIntelligenceGrid({ categories }: CategoryIntelligenceGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <div
            className="h-1 w-full"
            style={{ backgroundColor: cat.accentColor }}
          />
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--color-text)]">{cat.name}</h3>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                  cat.saveGrowthPercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {cat.saveGrowthPercent >= 0 ? '+' : ''}
                {cat.saveGrowthPercent.toLocaleString('fa-IR')}٪
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mb-3">
              <span className="flex items-center gap-1">
                <List className="w-3.5 h-3.5" />
                {cat.newListsCount.toLocaleString('fa-IR')} لیست جدید
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                تعامل {cat.engagementRatio.toFixed(1)}٪
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-bg)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.abs(cat.saveGrowthPercent) + 10)}%`,
                  backgroundColor: cat.accentColor,
                }}
              />
            </div>
            {cat.topRisingList && (
              <Link
                href={`/admin/lists/${cat.topRisingList.id}/edit`}
                className="mt-3 block text-xs text-[var(--primary)] hover:underline truncate"
              >
                ↑ {cat.topRisingList.title} (+{cat.topRisingList.growthPercent}٪)
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
