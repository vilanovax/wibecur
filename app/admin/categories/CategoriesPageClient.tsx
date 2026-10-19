'use client';

import {
  useState,
  useMemo,
  useEffect,
  useDeferredValue,
  useTransition,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import KpiStrip from '@/components/admin/categories/KpiStrip';
import CategoryFilterTabs from '@/components/admin/categories/CategoryFilterTabs';
import CategoryCard from '@/components/admin/categories/CategoryCard';
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
} from '@/lib/admin/category-intelligence-shared';
import { searchCategories, sortCategories } from '@/lib/admin/category-list-utils';

const viewFallback = (
  <div className="min-h-[240px] animate-pulse rounded-2xl bg-[var(--color-border-muted)]" />
);

/** Conditional / below-fold views — keep off the critical path (bundle-dynamic-imports) */
const CategoryIntelligenceTable = dynamic(
  () => import('@/components/admin/categories/CategoryIntelligenceTable'),
  { loading: () => viewFallback }
);
const CategoryReorderList = dynamic(
  () => import('@/components/admin/categories/CategoryReorderList'),
  { loading: () => viewFallback }
);
const CategoryTrashPanel = dynamic(
  () => import('@/components/admin/categories/CategoryTrashPanel'),
  { loading: () => null }
);

const VIEW_MODE_STORAGE_KEY = 'admin-categories-view-mode';

interface CategoriesPageClientProps {
  pulse: CategoryPulseSummary;
  categories: CategoryIntelligenceRow[];
  /** When true, title/CTA are rendered by the server shell (async-suspense-boundaries) */
  hideChrome?: boolean;
}

function filterByKind(
  categories: CategoryIntelligenceRow[],
  filter: CategoryFilterKind
): CategoryIntelligenceRow[] {
  switch (filter) {
    case 'all':
      return categories;
    case 'healthy':
      return categories.filter((c) => c.isActive && c.engagementRatio > 20);
    case 'needs_boost':
      return categories.filter(needsAlgorithmBoost);
    case 'declining':
      return categories.filter((c) => {
        const isNewActivity =
          c.saveGrowthPrevious === 0 && c.saveGrowthRecent > 0;
        return c.isActive && c.saveGrowthPercent < 0 && !isNewActivity;
      });
    case 'inactive':
      return categories.filter((c) => !c.isActive);
    default:
      return categories;
  }
}

/** Single pass for tab counts + active/avg engagement (js-combine-iterations) */
function summarizeCategories(categories: CategoryIntelligenceRow[]) {
  let activeCount = 0;
  let engagementSum = 0;
  const filterCounts: Record<CategoryFilterKind, number> = {
    all: categories.length,
    growing: 0,
    healthy: 0,
    needs_boost: 0,
    declining: 0,
    low_engagement: 0,
    needs_review: 0,
    inactive: 0,
  };

  for (const c of categories) {
    engagementSum += c.engagementRatio;
    if (!c.isActive) {
      filterCounts.inactive += 1;
      continue;
    }
    activeCount += 1;
    if (c.engagementRatio > 20) filterCounts.healthy += 1;
    if (needsAlgorithmBoost(c)) filterCounts.needs_boost += 1;
    const isNewActivity =
      c.saveGrowthPrevious === 0 && c.saveGrowthRecent > 0;
    if (c.saveGrowthPercent < 0 && !isNewActivity) filterCounts.declining += 1;
  }

  const avgEngagement =
    categories.length === 0
      ? '0%'
      : `${(engagementSum / categories.length).toFixed(1)}%`;

  return { activeCount, avgEngagement, filterCounts };
}

function readStoredViewMode(): CategoryViewMode {
  if (typeof window === 'undefined') return 'grid';
  const v = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (v === 'grid' || v === 'table' || v === 'reorder') return v;
  return 'grid';
}

export default function CategoriesPageClient({
  pulse,
  categories,
  hideChrome = false,
}: CategoriesPageClientProps) {
  const [filter, setFilter] = useState<CategoryFilterKind>('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [sortKey, setSortKey] = useState<CategorySortKey>('order');
  // SSR-safe default; restore persisted mode after mount (hydration-no-flicker tradeoff)
  const [viewMode, setViewMode] = useState<CategoryViewMode>('grid');
  const [, startViewTransition] = useTransition();

  useEffect(() => {
    setViewMode(readStoredViewMode());
  }, []);

  const handleViewModeChange = (mode: CategoryViewMode) => {
    startViewTransition(() => {
      setViewMode(mode);
    });
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      /* ignore quota / private mode */
    }
  };

  const { activeCount, avgEngagement, filterCounts } = useMemo(
    () => summarizeCategories(categories),
    [categories]
  );

  // Derive sort for needs_boost — no sync effect (rerender-derived-state-no-effect)
  const effectiveSortKey: CategorySortKey =
    filter === 'needs_boost' ? 'weight' : sortKey;

  const filteredByTab = useMemo(
    () => filterByKind(categories, filter),
    [categories, filter]
  );

  const displayed = useMemo(() => {
    const searched = searchCategories(filteredByTab, deferredSearch);
    return sortCategories(searched, effectiveSortKey);
  }, [filteredByTab, deferredSearch, effectiveSortKey]);

  const showEmpty =
    viewMode !== 'reorder' &&
    displayed.length === 0 &&
    (search.trim() !== '' || filter !== 'all');

  return (
    <div className="space-y-6" dir="rtl">
      {hideChrome ? null : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              مدیریت دسته‌بندی‌ها
            </h1>
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
      )}

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
        <CategoryFilterTabs
          value={filter}
          onChange={setFilter}
          counts={filterCounts}
        />
        {filter === 'needs_boost' ? (
          <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/25 border border-amber-200/80 dark:border-amber-800/50 rounded-lg px-3 py-2">
            دسته‌های فعال با وزن الگوریتمی کمتر از{' '}
            {CATEGORY_BOOST_WEIGHT.toLocaleString('fa-IR')}× — مرتب‌سازی بر اساس
            وزن (سبک‌ترین اول)
          </p>
        ) : null}
        <CategoryListToolbar
          search={search}
          onSearchChange={setSearch}
          sortKey={effectiveSortKey}
          onSortChange={setSortKey}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          resultCount={
            viewMode === 'reorder' ? categories.length : displayed.length
          }
          totalCount={categories.length}
        />
      </section>

      <section>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayed.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                badgeFlags={getCategoryBadgeFlags(cat)}
                highlightNeedsBoost={
                  filter === 'needs_boost' && needsAlgorithmBoost(cat)
                }
              />
            ))}
          </div>
        ) : null}

        {viewMode === 'table' ? (
          <CategoryIntelligenceTable
            categories={displayed}
            highlightNeedsBoostIds={
              filter === 'needs_boost'
                ? new Set(
                    displayed.filter(needsAlgorithmBoost).map((c) => c.id)
                  )
                : undefined
            }
          />
        ) : null}

        {viewMode === 'reorder' ? (
          <CategoryReorderList categories={categories} />
        ) : null}
      </section>

      {showEmpty ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-text-muted)] mb-4">
            {search.trim()
              ? 'نتیجه‌ای برای جستجو یافت نشد.'
              : filter === 'needs_boost'
                ? `هیچ دسته فعالی با وزن زیر ${CATEGORY_BOOST_WEIGHT.toLocaleString('fa-IR')}× نیست.`
                : 'با این فیلتر دسته‌ای یافت نشد.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {search.trim() ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                پاک کردن جستجو
              </button>
            ) : null}
            {filter !== 'all' ? (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                نمایش همه
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {viewMode !== 'reorder' &&
      displayed.length === 0 &&
      filter === 'all' &&
      !search.trim() &&
      categories.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-text-muted)] mb-4">
            دسته‌بندی‌ای وجود ندارد.
          </p>
          <Link
            href="/admin/categories/new"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            ایجاد اولین دسته
          </Link>
        </div>
      ) : null}

      <CategoryTrashPanel />
    </div>
  );
}
