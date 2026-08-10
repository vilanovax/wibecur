'use client';

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useDeferredValue,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, ChevronDown, ChevronUp, BarChart3, FileJson } from 'lucide-react';
import type {
  ListsIntelligenceData,
  ListIntelligenceRow,
} from '@/lib/admin/lists-types';
import { LISTS_PULSE_SAMPLE } from '@/lib/admin/lists-types';
import ListPulseSummary from '@/components/admin/lists/ListPulseSummary';
import ListSmartFilterBar, { type ListFilterKind } from '@/components/admin/lists/ListSmartFilterBar';
import type { ListAdminViewMode } from '@/components/admin/lists/ListCoversGallery';
import Pagination from '@/components/admin/shared/Pagination';
import {
  searchLists,
  countAllListFilters,
  listHasMissingCover,
} from '@/lib/admin/list-list-utils';
import Toast, { type ToastType } from '@/components/shared/Toast';

const viewFallback = (
  <div className="min-h-[280px] animate-pulse rounded-2xl bg-[var(--color-border-muted)]" />
);

const ListIntelligenceTable = dynamic(
  () => import('@/components/admin/lists/ListIntelligenceTable'),
  { loading: () => viewFallback }
);
const ListIntelligenceCard = dynamic(
  () => import('@/components/admin/lists/ListIntelligenceCard'),
  { loading: () => viewFallback }
);
const ListCoversGallery = dynamic(
  () => import('@/components/admin/lists/ListCoversGallery'),
  { loading: () => viewFallback }
);
const MoveToTrashModal = dynamic(
  () => import('@/components/admin/lists/MoveToTrashModal'),
  { loading: () => null }
);

type SortKey =
  | 'score_desc'
  | 'score_asc'
  | 'items_desc'
  | 'items_asc'
  | 'saves_desc'
  | 'saves_asc'
  | '24h_desc'
  | 'date_desc'
  | 'date_asc';

function filterLists(lists: ListIntelligenceRow[], filter: ListFilterKind): ListIntelligenceRow[] {
  switch (filter) {
    case 'all':
      return lists;
    case 'rising':
      return lists.filter((l) => l.status === 'rising');
    case 'trending_top':
      return lists.filter((l) => l.rank <= 10);
    case 'low_engagement':
      return lists.filter((l) => l.lowEngagement);
    case 'suspicious':
      return lists.filter((l) => l.riskLevel === 'medium' || l.riskLevel === 'high');
    case 'needs_review':
      return lists.filter((l) => l.needsReview);
    case 'zero_save':
      return lists.filter((l) => l.saveCount === 0);
    case 'featured':
      return lists.filter((l) => l.isFeatured);
    case 'no_cover':
      return lists.filter((l) => listHasMissingCover(l));
    default:
      return lists;
  }
}

function sortLists(lists: ListIntelligenceRow[], sortBy: SortKey): ListIntelligenceRow[] {
  const arr = [...lists];
  switch (sortBy) {
    case 'score_desc':
      return arr.sort((a, b) => b.trendingScore - a.trendingScore);
    case 'score_asc':
      return arr.sort((a, b) => a.trendingScore - b.trendingScore);
    case 'items_desc':
      return arr.sort((a, b) => b.itemCount - a.itemCount);
    case 'items_asc':
      return arr.sort((a, b) => a.itemCount - b.itemCount);
    case 'saves_desc':
      return arr.sort((a, b) => b.saveCount - a.saveCount);
    case 'saves_asc':
      return arr.sort((a, b) => a.saveCount - b.saveCount);
    case '24h_desc':
      return arr.sort((a, b) => b.saves24h - a.saves24h);
    case 'date_desc':
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'date_asc':
      return arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    default:
      return arr;
  }
}

const VIEW_MODE_KEY = 'admin-lists-view-mode';
const KPI_COLLAPSED_KEY = 'admin-lists-kpi-collapsed';

const EMPTY_COUNTS: Record<ListFilterKind, number> = {
  all: 0,
  rising: 0,
  trending_top: 0,
  low_engagement: 0,
  suspicious: 0,
  needs_review: 0,
  zero_save: 0,
  featured: 0,
  no_cover: 0,
};

export default function ListsIntelligenceClient({
  data,
  trash: isTrashView,
  initialCategoryId = 'all',
  initialSearch = '',
  initialFilter = 'all',
  embedded = false,
}: {
  data: ListsIntelligenceData;
  trash: boolean;
  initialCategoryId?: string;
  initialSearch?: string;
  initialFilter?: ListFilterKind;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<ListFilterKind>(initialFilter);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [search, setSearch] = useState(initialSearch);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('score_desc');
  const [viewMode, setViewMode] = useState<ListAdminViewMode>('table');
  const [kpiCollapsed, setKpiCollapsed] = useState(true);
  const [lists, setLists] = useState<ListIntelligenceRow[]>(data.lists);
  const [moveToTrashRow, setMoveToTrashRow] = useState<ListIntelligenceRow | null>(null);
  const [coverAuditOpen, setCoverAuditOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    setLists(data.lists);
    setCategoryId(initialCategoryId);
  }, [data.lists, initialCategoryId]);

  // همگام‌سازی با URL (back/forward یا بعد از ناوبریِ جستجو)
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    },
    []
  );

  useEffect(() => {
    const storedView = localStorage.getItem(VIEW_MODE_KEY);
    if (storedView === 'grid' || storedView === 'table' || storedView === 'covers') {
      setViewMode(storedView);
    }
    const storedKpi = localStorage.getItem(KPI_COLLAPSED_KEY);
    if (storedKpi === '0') setKpiCollapsed(false);
  }, []);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
    if (viewMode !== 'covers') setCoverAuditOpen(false);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(KPI_COLLAPSED_KEY, kpiCollapsed ? '1' : '0');
  }, [kpiCollapsed]);

  const filterCounts = useMemo(
    () => (lists.length === 0 ? EMPTY_COUNTS : countAllListFilters(lists)),
    [lists]
  );

  const deferredSearch = useDeferredValue(search);
  const filteredByTab = useMemo(() => filterLists(lists, filter), [lists, filter]);
  const searched = useMemo(
    () => searchLists(filteredByTab, deferredSearch),
    [filteredByTab, deferredSearch]
  );
  const sorted = useMemo(() => sortLists(searched, sortBy), [searched, sortBy]);

  const handleFilterChange = useCallback(
    (next: ListFilterKind) => {
      setFilter(next);
      const params = new URLSearchParams(window.location.search);
      if (next === 'all') params.delete('filter');
      else params.set('filter', next);
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `/admin/lists?${qs}` : '/admin/lists', { scroll: false });
    },
    [router]
  );

  const handleCategoryChange = useCallback(
    (nextCategoryId: string) => {
      setCategoryId(nextCategoryId);
      const params = new URLSearchParams(window.location.search);
      if (nextCategoryId === 'all') {
        params.delete('category');
      } else {
        const cat = data.categories.find((c) => c.id === nextCategoryId);
        params.set('category', cat?.slug ?? nextCategoryId);
      }
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `/admin/lists?${qs}` : '/admin/lists', { scroll: false });
    },
    [data.categories, router]
  );

  // جستجوی سرور-ساید: ورودی فوراً به‌روز می‌شود (واکنش‌گرا) و با debounce به URL
  // ناوبری می‌شود تا سرور روی همهٔ صفحات جستجو کند (نه فقط صفحهٔ جاری).
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const trimmed = value.trim();
        if (trimmed) params.set('q', trimmed);
        else params.delete('q');
        params.delete('page');
        const qs = params.toString();
        router.replace(qs ? `/admin/lists?${qs}` : '/admin/lists', { scroll: false });
      }, 400);
    },
    [router]
  );

  const handleClearFilters = useCallback(() => {
    setFilter('all');
    setSearch('');
    setCategoryId('all');
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const params = new URLSearchParams(window.location.search);
    params.delete('q');
    params.delete('category');
    params.delete('filter');
    params.delete('page');
    const qs = params.toString();
    router.replace(qs ? `/admin/lists?${qs}` : '/admin/lists', { scroll: false });
  }, [router]);

  const handleMoveToTrash = async (id: string, reason?: string) => {
    const res = await fetch(`/api/admin/lists/${id}/trash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || null }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'خطا');
    setLists((prev) => prev.filter((l) => l.id !== id));
    setMoveToTrashRow(null);
    router.refresh();
    setToast({ message: 'لیست به زباله‌دان منتقل شد', type: 'success' });
  };

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/admin/lists/${id}/restore`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'خطا');
    setLists((prev) => prev.filter((l) => l.id !== id));
    router.refresh();
    setToast({ message: 'لیست بازگردانی شد', type: 'success' });
  };

  const handleFeatureToggle = (id: string, isFeatured: boolean) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, isFeatured } : l)));
    setToast({
      message: isFeatured ? 'لیست به Featured اضافه شد' : 'از Featured حذف شد',
      type: 'success',
    });
  };

  const handleDisableToggle = (id: string, isActive: boolean) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, isActive } : l)));
    setToast({
      message: isActive ? 'لیست فعال شد' : 'لیست غیرفعال شد',
      type: 'success',
    });
  };

  const activeCategory = categoryId !== 'all' ? data.categories.find((c) => c.id === categoryId) : null;
  const hasActiveFilters = filter !== 'all' || search.trim() !== '' || categoryId !== 'all';

  const showEmpty =
    sorted.length === 0 && (search.trim() !== '' || filter !== 'all' || categoryId !== 'all');

  const filterBarProps = {
    value: filter,
    onChange: handleFilterChange,
    counts: filterCounts,
    search,
    onSearchChange: handleSearchChange,
    sortBy,
    onSortChange: (v: string) => setSortBy(v as SortKey),
    viewMode,
    onViewModeChange: setViewMode,
    resultCount: sorted.length,
    totalCount: lists.length,
    categories: data.categories,
    categoryId,
    onCategoryChange: handleCategoryChange,
    onClearFilters: handleClearFilters,
    hasActiveFilters,
    onOpenCoverAudit:
      viewMode === 'covers' && !isTrashView ? () => setCoverAuditOpen(true) : undefined,
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-[var(--primary)] text-white shadow-sm'
        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
    }`;

  return (
    <div className="space-y-4" dir="rtl">
      {!embedded && (
      <>
      {/* هدر فشرده */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-[var(--color-text)]">لیست‌ها</h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-muted)] text-[var(--color-text-muted)] tabular-nums">
              {data.pulse.totalLists.toLocaleString('fa-IR')} کل
            </span>
            {activeCategory && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                {activeCategory.icon} {activeCategory.name}
              </span>
            )}
          </div>
          {data.pulseFromSample && !isTrashView && (
            <p className="text-xs text-[var(--color-text-muted)]">
              KPI از {LISTS_PULSE_SAMPLE.toLocaleString('fa-IR')} لیست برتر
            </p>
          )}
          {!isTrashView && kpiCollapsed && data.pulse.insightLine && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate" title={data.pulse.insightLine}>
              {data.pulse.insightLine}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* تب‌ها */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-muted)]">
            <Link
              href={
                categoryId !== 'all' && activeCategory
                  ? `/admin/lists?category=${activeCategory.slug}`
                  : '/admin/lists'
              }
              className={tabClass(!isTrashView)}
            >
              فعال‌ها
            </Link>
            <Link href="/admin/lists?trash=true" className={tabClass(isTrashView)}>
              زباله‌دان
            </Link>
          </div>

          {!isTrashView && (
            <>
              <Link
                href="/admin/lists?view=import"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-violet-200 text-violet-700 bg-violet-50/80 hover:bg-violet-100 transition-colors"
                title="import گروهی JSON — همه دسته‌ها"
              >
                <FileJson className="w-4 h-4" />
                <span className="hidden md:inline">import گروهی</span>
              </Link>
              <Link
                href="/admin/custom/featured"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-amber-200 text-amber-800 bg-amber-50/80 hover:bg-amber-100 transition-colors"
                title="مدیریت اسلات Featured"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">اسلات Featured</span>
              </Link>
              <Link
                href="/admin/lists/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Plus className="w-4 h-4" />
                جدید
              </Link>
            </>
          )}
        </div>
      </header>

      {/* KPI — قابل جمع‌شدن */}
      {!isTrashView && (
        <section className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
          <button
            type="button"
            onClick={() => setKpiCollapsed((c) => !c)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-[var(--color-bg)]/50 transition-colors"
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
              خلاصه KPI
              {kpiCollapsed && (
                <span className="text-xs font-normal text-[var(--color-text-muted)] tabular-nums">
                  · {data.pulse.totalLists.toLocaleString('fa-IR')} کل
                  {data.pulse.lowEngagementLists > 0 && ` · ${data.pulse.lowEngagementLists.toLocaleString('fa-IR')} کم‌تعامل`}
                </span>
              )}
            </span>
            {kpiCollapsed ? (
              <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
            ) : (
              <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
            )}
          </button>
          {!kpiCollapsed && (
            <div className="px-3 pb-3 border-t border-[var(--color-border-muted)] pt-2">
              <ListPulseSummary
                pulse={data.pulse}
                activeFilter={filter}
                onFilterClick={handleFilterChange}
              />
            </div>
          )}
        </section>
      )}
      </>
      )}

      {embedded && (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-muted)] w-fit">
          <Link
            href={
              categoryId !== 'all' && activeCategory
                ? `/admin/lists?category=${activeCategory.slug}`
                : '/admin/lists'
            }
            className={tabClass(!isTrashView)}
          >
            فعال‌ها
          </Link>
          <Link href="/admin/lists?trash=true" className={tabClass(isTrashView)}>
            زباله‌دان
          </Link>
        </div>
      )}

      {isTrashView && lists.length > 0 && (
        <p className="text-sm text-[var(--color-text-muted)] px-1">
          {lists.length.toLocaleString('fa-IR')} لیست — قابل بازگردانی
        </p>
      )}

      {/* فیلتر sticky — هنگام اسکرول ثابت می‌ماند */}
      <div className="sticky top-0 z-30 -mx-1 px-1 py-2 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border-muted)] shadow-sm rounded-xl">
        <div className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-2.5 shadow-sm">
          <ListSmartFilterBar {...filterBarProps} />
        </div>
      </div>

      {/* نتایج */}
      <div className="space-y-3">
      {sorted.length > 0 && (
        <>
          {data.pagination.totalPages > 1 && (
            <p className="text-xs text-[var(--color-text-muted)] px-0.5 tabular-nums">
              صفحه {data.pagination.currentPage.toLocaleString('fa-IR')} از{' '}
              {data.pagination.totalPages.toLocaleString('fa-IR')}
              {hasActiveFilters && ` · ${sorted.length.toLocaleString('fa-IR')} نتیجه در این صفحه`}
            </p>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {sorted.map((row) => (
                <ListIntelligenceCard
                  key={row.id}
                  row={row}
                  isTrashView={isTrashView}
                  onFeatureToggle={isTrashView ? undefined : handleFeatureToggle}
                  onDisableToggle={isTrashView ? undefined : handleDisableToggle}
                  onMoveToTrash={isTrashView ? undefined : () => setMoveToTrashRow(row)}
                  onRestore={isTrashView ? handleRestore : undefined}
                />
              ))}
            </div>
          ) : viewMode === 'covers' && !isTrashView ? (
            <ListCoversGallery
              rows={sorted}
              auditOpen={coverAuditOpen}
              onAuditOpenChange={setCoverAuditOpen}
              onFeatureToggle={handleFeatureToggle}
              onDisableToggle={handleDisableToggle}
              onMoveToTrash={(row) => setMoveToTrashRow(row)}
              onOptimized={() => router.refresh()}
            />
          ) : (
            <ListIntelligenceTable
              rows={sorted}
              isTrashView={isTrashView}
              onFeatureToggle={isTrashView ? undefined : handleFeatureToggle}
              onDisableToggle={isTrashView ? undefined : handleDisableToggle}
              onMoveToTrash={isTrashView ? undefined : (row) => setMoveToTrashRow(row)}
              onRestore={isTrashView ? handleRestore : undefined}
            />
          )}
        </>
      )}

      {data.pagination.totalPages > 1 && sorted.length > 0 && (
        <Pagination
          currentPage={data.pagination.currentPage}
          totalPages={data.pagination.totalPages}
          basePath="/admin/lists"
          searchParams={{
            ...(isTrashView ? { trash: 'true' } : {}),
            ...(categoryId !== 'all' && activeCategory ? { category: activeCategory.slug } : {}),
            ...(search.trim() ? { q: search.trim() } : {}),
          }}
        />
      )}
      </div>

      <MoveToTrashModal
        row={moveToTrashRow}
        open={!!moveToTrashRow}
        onClose={() => setMoveToTrashRow(null)}
        onConfirm={handleMoveToTrash}
      />

      {showEmpty && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-10 text-center">
          <p className="text-[var(--color-text-muted)] text-sm mb-3">
            {search.trim()
              ? 'نتیجه‌ای یافت نشد.'
              : categoryId !== 'all'
                ? 'در این دسته لیستی با این فیلتر نیست.'
                : 'با این فیلتر لیستی نیست.'}
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            پاک کردن فیلترها
          </button>
        </div>
      )}

      {sorted.length === 0 && !showEmpty && filter === 'all' && categoryId === 'all' && !search.trim() && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-10 text-center text-sm text-[var(--color-text-muted)]">
          لیستی یافت نشد.
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={3500} />
      )}
    </div>
  );
}
