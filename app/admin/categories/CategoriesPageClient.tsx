'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import KpiStrip from '@/components/admin/categories/KpiStrip';
import CategoryFilterTabs from '@/components/admin/categories/CategoryFilterTabs';
import CategoryCard from '@/components/admin/categories/CategoryCard';
import CategoryIntelligenceTable from '@/components/admin/categories/CategoryIntelligenceTable';
import CategoryReorderList from '@/components/admin/categories/CategoryReorderList';
import CategoryListToolbar from '@/components/admin/categories/CategoryListToolbar';
import type {
  CategoryPulseSummary,
  CategoryIntelligenceRow,
  CategoryFilterKind,
  CategoryViewMode,
  CategorySortKey,
} from '@/lib/admin/categories-types';
import {
  getCategoryBadgeFlags,
  needsAlgorithmBoost,
  CATEGORY_BOOST_WEIGHT,
} from '@/lib/admin/category-intelligence';
import { searchCategories, sortCategories } from '@/lib/admin/category-list-utils';
import CategoryTrashPanel from '@/components/admin/categories/CategoryTrashPanel';

const VIEW_MODE_STORAGE_KEY = 'admin-categories-view-mode';

interface CategoriesPageClientProps {
  pulse: CategoryPulseSummary;
  categories: CategoryIntelligenceRow[];
}

function filterByKind(
  categories: CategoryIntelligenceRow[],
  filter: CategoryFilterKind
): CategoryIntelligenceRow[] {
  switch (filter) {
    case 'all':
      return [...categories];
    case 'healthy':
      return categories.filter((c) => c.isActive && c.engagementRatio > 20);
    case 'needs_boost':
      return categories.filter(needsAlgorithmBoost);
    case 'declining':
      return categories.filter((c) => {
        const isNewActivity = c.saveGrowthPrevious === 0 && c.saveGrowthRecent > 0;
        return c.isActive && c.saveGrowthPercent < 0 && !isNewActivity;
      });
    case 'inactive':
      return categories.filter((c) => !c.isActive);
    default:
      return [...categories];
  }
}

function countForFilter(categories: CategoryIntelligenceRow[], filter: CategoryFilterKind): number {
  return filterByKind(categories, filter).length;
}

function readStoredViewMode(): CategoryViewMode {
  if (typeof window === 'undefined') return 'grid';
  const v = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (v === 'grid' || v === 'table' || v === 'reorder') return v;
  return 'grid';
}

export default function CategoriesPageClient({ pulse, categories }: CategoriesPageClientProps) {
  const [filter, setFilter] = useState<CategoryFilterKind>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<CategorySortKey>('order');
  const [viewMode, setViewMode] = useState<CategoryViewMode>('grid');

  useEffect(() => {
    setViewMode(readStoredViewMode());
  }, []);

  useEffect(() => {
    if (filter === 'needs_boost') {
      setSortKey('weight');
    }
  }, [filter]);

  const handleViewModeChange = (mode: CategoryViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  const filteredByTab = useMemo(() => filterByKind(categories, filter), [categories, filter]);

  const effectiveSortKey: CategorySortKey =
    filter === 'needs_boost' ? 'weight' : sortKey;

  const displayed = useMemo(() => {
    const searched = searchCategories(filteredByTab, search);
    return sortCategories(searched, effectiveSortKey);
  }, [filteredByTab, search, effectiveSortKey]);

  const activeCount = useMemo(() => categories.filter((c) => c.isActive).length, [categories]);
  const avgEngagement = useMemo(() => {
    if (categories.length === 0) return '0%';
    const sum = categories.reduce((s, c) => s + c.engagementRatio, 0);
    return `${(sum / categories.length).toFixed(1)}%`;
  }, [categories]);

  const filterCounts = useMemo(
    () =>
      ({
        all: countForFilter(categories, 'all'),
        healthy: countForFilter(categories, 'healthy'),
        needs_boost: countForFilter(categories, 'needs_boost'),
        declining: countForFilter(categories, 'declining'),
        inactive: countForFilter(categories, 'inactive'),
      }) as Record<CategoryFilterKind, number>,
    [categories]
  );

  const showEmpty =
    viewMode !== 'reorder' && displayed.length === 0 && (search.trim() !== '' || filter !== 'all');

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">مدیریت دسته‌بندی‌ها</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            ابزار تصمیم‌گیری — سلامت، رشد و قابلیت درآمدزایی
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

      <section>
        <KpiStrip
          totalCategories={pulse.totalCategories}
          activeCategories={activeCount}
          monetizableCount={pulse.monetizableCount}
          avgEngagementRate={avgEngagement}
          insightLine={pulse.insightLine}
        />
      </section>

      <section className="space-y-3">
        <CategoryFilterTabs value={filter} onChange={setFilter} counts={filterCounts} />
        {filter === 'needs_boost' && (
          <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/25 border border-amber-200/80 dark:border-amber-800/50 rounded-lg px-3 py-2">
            دسته‌های فعال با وزن الگوریتمی کمتر از {CATEGORY_BOOST_WEIGHT.toLocaleString('fa-IR')}× —
            مرتب‌سازی بر اساس وزن (سبک‌ترین اول)
          </p>
        )}
        <CategoryListToolbar
          search={search}
          onSearchChange={setSearch}
          sortKey={effectiveSortKey}
          onSortChange={setSortKey}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          resultCount={viewMode === 'reorder' ? categories.length : displayed.length}
          totalCount={categories.length}
        />
      </section>

      <section>
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayed.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                badgeFlags={getCategoryBadgeFlags(cat)}
                highlightNeedsBoost={filter === 'needs_boost' && needsAlgorithmBoost(cat)}
              />
            ))}
          </div>
        )}

        {viewMode === 'table' && (
          <CategoryIntelligenceTable
            categories={displayed}
            highlightNeedsBoostIds={
              filter === 'needs_boost'
                ? new Set(displayed.filter(needsAlgorithmBoost).map((c) => c.id))
                : undefined
            }
          />
        )}

        {viewMode === 'reorder' && <CategoryReorderList categories={categories} />}
      </section>

      {showEmpty && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-text-muted)] mb-4">
            {search.trim()
              ? 'نتیجه‌ای برای جستجو یافت نشد.'
              : filter === 'needs_boost'
                ? `هیچ دسته فعالی با وزن زیر ${CATEGORY_BOOST_WEIGHT.toLocaleString('fa-IR')}× نیست.`
                : 'با این فیلتر دسته‌ای یافت نشد.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                پاک کردن جستجو
              </button>
            )}
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
        </div>
      )}

      {viewMode !== 'reorder' && displayed.length === 0 && filter === 'all' && !search.trim() && categories.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-text-muted)] mb-4">دسته‌بندی‌ای وجود ندارد.</p>
          <Link
            href="/admin/categories/new"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            ایجاد اولین دسته
          </Link>
        </div>
      )}

      <CategoryTrashPanel />
    </div>
  );
}
