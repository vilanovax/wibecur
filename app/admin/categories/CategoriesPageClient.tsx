'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { LayoutGrid, List, Plus } from 'lucide-react';
import CategoryPulseOverview from '@/components/admin/categories/CategoryPulseOverview';
import CategoryFilterBar from '@/components/admin/categories/CategoryFilterBar';
import CategoryIntelligenceCard from '@/components/admin/categories/CategoryIntelligenceCard';
import CategoryIntelligenceTable from '@/components/admin/categories/CategoryIntelligenceTable';
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

export default function CategoriesPageClient({
  pulse,
  categories,
  totalPages,
  currentPage,
}: CategoriesPageClientProps) {
  const [filter, setFilter] = useState<CategoryFilterKind>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filtered = useMemo(() => {
    let list = [...categories];
    switch (filter) {
      case 'growing':
        list = list.filter((c) => c.saveGrowthPercent > 0);
        break;
      case 'low_engagement':
        list = list.filter((c) => c.engagementRatio < 5);
        break;
      case 'needs_review':
        list = list.filter((c) => c.listCount > 0 && c.saveGrowthPercent < 0);
        break;
      case 'inactive':
        list = list.filter((c) => !c.isActive);
        break;
      default:
        break;
    }
    return list;
  }, [categories, filter]);

  return (
    <div className="space-y-6">
      {/* Header – subtle, no heavy gradient */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            مدیریت دسته‌بندی‌ها
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            کنترل رتبه‌بندی و ترند؛ داده‌محور و قابل‌درآمد
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus className="w-4 h-4" />
          دسته‌بندی جدید
        </Link>
      </div>

      <CategoryPulseOverview data={pulse} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <CategoryFilterBar value={filter} onChange={setFilter} />
        <div className="flex items-center gap-1 bg-[var(--color-bg)] rounded-xl p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-[var(--color-surface)] text-[var(--primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
            title="گرید"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-[var(--color-surface)] text-[var(--primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
            title="جدول"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((cat) => (
            <CategoryIntelligenceCard key={cat.id} category={cat} />
          ))}
        </div>
      ) : (
        <CategoryIntelligenceTable categories={filtered} />
      )}

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-text-muted)] mb-4">
            {filter === 'all' ? 'دسته‌بندی‌ای وجود ندارد.' : 'با این فیلتر دسته‌ای یافت نشد.'}
          </p>
          {filter !== 'all' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="text-sm text-[var(--primary)] hover:underline"
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
