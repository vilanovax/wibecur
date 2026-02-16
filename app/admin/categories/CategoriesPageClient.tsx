'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import KpiStrip from '@/components/admin/categories/KpiStrip';
import CategoryFilterTabs from '@/components/admin/categories/CategoryFilterTabs';
import CategoryCard from '@/components/admin/categories/CategoryCard';
import Pagination from '@/components/admin/shared/Pagination';
import type { CategoryPulseSummary } from '@/lib/admin/categories-types';
import type { CategoryIntelligenceRow } from '@/lib/admin/categories-types';
import type { CategoryFilterKind } from '@/lib/admin/categories-types';

interface CategoriesPageClientProps {
  pulse: CategoryPulseSummary;
  categories: CategoryIntelligenceRow[];
  totalPages: number;
  currentPage: number;
}

function filterByKind(categories: CategoryIntelligenceRow[], filter: CategoryFilterKind): CategoryIntelligenceRow[] {
  switch (filter) {
    case 'all':
      return [...categories];
    case 'healthy':
      return categories.filter((c) => c.isActive && c.engagementRatio > 20);
    case 'needs_boost':
      return categories.filter(
        (c) => c.isActive && c.engagementRatio <= 20 && c.engagementRatio >= 0 && c.saveGrowthPercent >= 0
      );
    case 'declining':
      return categories.filter((c) => c.isActive && c.saveGrowthPercent < 0);
    case 'inactive':
      return categories.filter((c) => !c.isActive);
    default:
      return [...categories];
  }
}

export default function CategoriesPageClient({
  pulse,
  categories,
  totalPages,
  currentPage,
}: CategoriesPageClientProps) {
  const [filter, setFilter] = useState<CategoryFilterKind>('all');

  const filtered = useMemo(() => filterByKind(categories, filter), [categories, filter]);

  const activeCount = useMemo(() => categories.filter((c) => c.isActive).length, [categories]);
  const avgEngagement = useMemo(() => {
    if (categories.length === 0) return '0%';
    const sum = categories.reduce((s, c) => s + c.engagementRatio, 0);
    return `${(sum / categories.length).toFixed(1)}%`;
  }, [categories]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            مدیریت دسته‌بندی‌ها
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            ابزار تصمیم‌گیری — سلامت، رشد و قابلیت درآمدزایی
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          دسته‌بندی جدید
        </Link>
      </div>

      {/* 1️⃣ Top Summary Strip */}
      <section>
        <KpiStrip
          totalCategories={pulse.totalCategories}
          activeCategories={activeCount}
          monetizableCount={pulse.monetizableCount}
          avgEngagementRate={avgEngagement}
        />
      </section>

      {/* 2️⃣ Smart Filter Bar */}
      <section>
        <CategoryFilterTabs value={filter} onChange={setFilter} />
      </section>

      {/* 3️⃣ Category Cards Grid */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filter === 'all' ? 'دسته‌بندی‌ای وجود ندارد.' : 'با این فیلتر دسته‌ای یافت نشد.'}
          </p>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              نمایش همه
            </button>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/admin/categories"
        />
      )}
    </div>
  );
}
