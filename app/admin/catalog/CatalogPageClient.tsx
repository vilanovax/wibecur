'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Library,
  Search,
  GitMerge,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Info,
  X,
  ListPlus,
} from 'lucide-react';
import AddToListModal from '@/components/admin/catalog/AddToListModal';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import {
  catalogCategoryLabel,
  formatExternalKeyHint,
} from '@/lib/catalog-display';
import type {
  CatalogCategoryFilter,
  CatalogListRow,
  DuplicateCatalogGroup,
} from '@/lib/catalog-items';

type Tab = 'browse' | 'duplicates';

type ListOption = { id: string; title: string; icon?: string | null };

interface CatalogPageClientProps {
  initialTab: Tab;
  initialRows: CatalogListRow[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialQuery: string;
  initialCategory: string;
  initialCategoryFilters: { total: number; categories: CatalogCategoryFilter[] };
  initialDuplicateGroups: DuplicateCatalogGroup[];
  lists: ListOption[];
}

export default function CatalogPageClient({
  initialTab,
  initialRows,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialQuery,
  initialCategory,
  initialCategoryFilters,
  initialDuplicateGroups,
  lists,
}: CatalogPageClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [groups, setGroups] = useState(initialDuplicateGroups);
  const [dupCount, setDupCount] = useState(initialDuplicateGroups.length);
  const [mergeLoading, setMergeLoading] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{
    title: string;
    categorySlug: string | null;
    placements: { itemId: string; listId: string; listTitle: string; listSlug: string }[];
  } | null>(null);

  const pushUrl = useCallback(
    (next: { tab?: Tab; page?: number; q?: string; category?: string }) => {
      const p = new URLSearchParams();
      const t = next.tab ?? tab;
      if (t === 'duplicates') p.set('tab', 'duplicates');
      if ((next.q ?? query).trim()) p.set('q', (next.q ?? query).trim());
      const cat = next.category !== undefined ? next.category : category;
      if (cat) p.set('category', cat);
      if (t === 'browse') p.set('page', String(next.page ?? page));
      router.push(`/admin/catalog?${p.toString()}`);
    },
    [router, tab, query, page, category]
  );

  const loadBrowse = async (nextPage: number, nextQ: string, nextCategory = category) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(nextPage), perPage: '24' });
      if (nextQ.trim()) p.set('q', nextQ.trim());
      if (nextCategory) p.set('categorySlug', nextCategory);
      const res = await fetch(`/api/admin/catalog-items?${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows(data.rows);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/catalog-items/duplicates');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const g = data.groups ?? [];
      setGroups(g);
      setDupCount(g.length);
      const defaults: Record<string, string> = {};
      for (const group of g as DuplicateCatalogGroup[]) {
        defaults[group.groupKey] = group.catalogs[0]?.id ?? '';
      }
      setMergeTarget((prev) => ({ ...defaults, ...prev }));
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setMessage('');
    pushUrl({ tab: t, page: 1 });
    if (t === 'duplicates') void loadDuplicates();
  };

  const openDetail = async (catalogId: string) => {
    setSelectedDetail(catalogId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/catalog-items/${catalogId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetail({
        title: data.title,
        categorySlug: data.categorySlug ?? null,
        placements: data.placements ?? [],
      });
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMergeGroup = async (group: DuplicateCatalogGroup) => {
    const targetId = mergeTarget[group.groupKey] || group.catalogs[0]?.id;
    if (!targetId) return;
    const sources = group.catalogs.map((c) => c.id).filter((id) => id !== targetId);
    if (sources.length === 0) return;
    const targetTitle = group.catalogs.find((c) => c.id === targetId)?.title ?? '';
    if (
      !confirm(
        `ادغام ${sources.length} مورد دیگر در «${targetTitle}»؟\nاین کار قابل بازگشت نیست.`
      )
    ) {
      return;
    }
    setMergeLoading(group.groupKey);
    setMessage('');
    try {
      const res = await fetch('/api/admin/catalog-items/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCatalogId: targetId, sourceCatalogIds: sources }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message ?? 'ادغام انجام شد');
      setGroups((prev) => prev.filter((g) => g.groupKey !== group.groupKey));
      setDupCount((c) => Math.max(0, c - 1));
      if (tab === 'browse') void loadBrowse(page, query);
      router.refresh();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'خطا در ادغام');
    } finally {
      setMergeLoading(null);
    }
  };

  const selectedRow = rows.find((r) => r.id === selectedDetail);

  const setCategoryFilter = (slug: string) => {
    setCategory(slug);
    setPage(1);
    pushUrl({ category: slug, page: 1 });
    void loadBrowse(1, query, slug);
  };

  const { total: catalogTotal, categories: categoryChips } = initialCategoryFilters;

  return (
    <div className="pb-8" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Library className="w-6 h-6 text-violet-700" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">آیتم‌ها</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              کاتالوگ · {total.toLocaleString('fa-IR')} موجودیت · یک آیتم در چند لیست
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/admin/items"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            بر اساس لیست
          </Link>
          <Link
            href="/admin/items/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            افزودن به لیست
          </Link>
        </div>
      </div>

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          هر کارت اینجا <strong>یک موجودیت</strong> است (مثلاً یک فیلم). با کلیک ببینید در کدام
          لیست‌ها است. ویرایش عنوان/تصویر از یک جایگاه، همهٔ لیست‌ها را به‌روز می‌کند.
        </p>
      </div>

      {/* تب‌ها */}
      <div className="inline-flex p-1 rounded-xl bg-gray-100 mb-5">
        <button
          type="button"
          onClick={() => switchTab('browse')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            tab === 'browse' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          مرور کاتالوگ
        </button>
        <button
          type="button"
          onClick={() => switchTab('duplicates')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
            tab === 'duplicates' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <GitMerge className="w-4 h-4" />
          ادغام تکراری
          {dupCount > 0 && (
            <span className="rounded-full bg-amber-500 text-white text-[10px] min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
              {dupCount > 99 ? '۹۹+' : dupCount.toLocaleString('fa-IR')}
            </span>
          )}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`text-sm rounded-xl px-4 py-3 mb-4 ${
            message.includes('ادغام') || message.includes('منتقل')
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {message}
        </p>
      )}

      <div
        className={`grid gap-6 ${selectedDetail ? 'lg:grid-cols-[1fr_300px]' : ''}`}
      >
        <div className="min-w-0">
          {tab === 'browse' && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    !category
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                  }`}
                >
                  همه ({catalogTotal.toLocaleString('fa-IR')})
                </button>
                {categoryChips.map((c) => {
                  const slug = c.slug ?? '__none__';
                  const isActive = category === slug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setCategoryFilter(slug)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        isActive
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      {catalogCategoryLabel(c.slug)} ({c.count.toLocaleString('fa-IR')})
                    </button>
                  );
                })}
              </div>

              <form
                className="flex flex-col sm:flex-row gap-2 mb-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  pushUrl({ page: 1, q: query });
                  void loadBrowse(1, query, category);
                }}
              >
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="جستجو با عنوان…"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-50 shrink-0"
                >
                  جستجو
                </button>
              </form>

              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                  <p className="text-gray-600 mb-3">هنوز در کاتالوگ چیزی نیست یا نتیجه‌ای پیدا نشد.</p>
                  <Link
                    href="/admin/items/new"
                    className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    ساخت اولین آیتم
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {rows.map((row) => {
                    const extHint = formatExternalKeyHint(row.externalKey);
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => openDetail(row.id)}
                        className={`group text-right rounded-xl border p-3 transition-all hover:shadow-md ${
                          selectedDetail === row.id
                            ? 'border-violet-500 bg-violet-50/50 ring-2 ring-violet-200'
                            : 'border-gray-200 bg-white hover:border-violet-200'
                        }`}
                      >
                        <div className="flex gap-3 items-center">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 ring-1 ring-black/5">
                            <ImageWithFallback
                              src={row.imageUrl ?? ''}
                              alt=""
                              className="w-full h-full object-cover"
                              fallbackIcon="📋"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">
                              {row.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {catalogCategoryLabel(row.categorySlug)}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {row.listCount.toLocaleString('fa-IR')} لیست
                              </span>
                            </div>
                            {extHint && (
                              <p
                                className="text-[10px] text-violet-600/80 mt-1 truncate"
                                title={row.externalKey ?? undefined}
                              >
                                {extHint}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => {
                      const np = page - 1;
                      pushUrl({ page: np });
                      void loadBrowse(np, query, category);
                    }}
                    className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40"
                    aria-label="صفحه قبل"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600 tabular-nums">
                    صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => {
                      const np = page + 1;
                      pushUrl({ page: np });
                      void loadBrowse(np, query, category);
                    }}
                    className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40"
                    aria-label="صفحه بعد"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'duplicates' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                موارد با عنوان مشابه را یکی کنید: یکی را به‌عنوان <strong>مقصد</strong> انتخاب
                کنید، بقیه ادغام می‌شوند.
              </p>
              {loading && groups.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-14 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-emerald-800 font-medium">تکرار احتمالی یافت نشد</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.groupKey}
                    className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-white p-4 space-y-3 shadow-sm"
                  >
                    <p className="text-xs font-bold text-amber-900">
                      {group.catalogs.length.toLocaleString('fa-IR')} مورد مشابه
                      {group.categorySlug && (
                        <span className="font-normal text-amber-800/80">
                          {' '}
                          · {catalogCategoryLabel(group.categorySlug)}
                        </span>
                      )}
                    </p>
                    <ul className="space-y-1.5" role="radiogroup" aria-label="انتخاب مقصد ادغام">
                      {group.catalogs.map((c) => (
                        <li key={c.id}>
                          <label className="flex items-center gap-3 rounded-xl border border-white/80 bg-white px-3 py-2.5 cursor-pointer hover:border-violet-200 has-[:checked]:border-violet-400 has-[:checked]:bg-violet-50/50">
                            <input
                              type="radio"
                              name={`merge-${group.groupKey}`}
                              checked={(mergeTarget[group.groupKey] ?? group.catalogs[0]?.id) === c.id}
                              onChange={() =>
                                setMergeTarget((p) => ({ ...p, [group.groupKey]: c.id }))
                              }
                              className="text-violet-600 focus:ring-violet-500"
                            />
                            <span className="flex-1 text-sm font-medium truncate">{c.title}</span>
                            <span className="text-xs text-gray-500 shrink-0">
                              {c.listCount} لیست
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={mergeLoading === group.groupKey}
                      onClick={() => handleMergeGroup(group)}
                      className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50"
                    >
                      {mergeLoading === group.groupKey ? 'در حال ادغام…' : 'ادغام در مقصد انتخاب‌شده'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* پنل جزئیات */}
        {selectedDetail && (
          <aside className="fixed inset-y-0 left-0 z-40 w-[min(100%,20rem)] shadow-2xl lg:static lg:z-auto lg:w-auto lg:shadow-none lg:sticky lg:top-4 lg:self-start">
            <div className="h-full lg:h-auto rounded-none lg:rounded-2xl border-0 lg:border border-gray-200 bg-white lg:shadow-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-sm text-gray-900 truncate">جزئیات</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetail(null);
                    setDetail(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"
                  aria-label="بستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {detailLoading ? (
                <div className="p-4 space-y-3 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-16 bg-gray-100 rounded" />
                </div>
              ) : detail ? (
                <div className="p-4">
                  {selectedRow?.imageUrl && (
                    <div className="w-full aspect-[2/1] rounded-xl overflow-hidden mb-3 bg-gray-100">
                      <ImageWithFallback
                        src={selectedRow.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        fallbackIcon="📋"
                      />
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 leading-snug">{detail.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {catalogCategoryLabel(detail.categorySlug)} ·{' '}
                    {detail.placements.length.toLocaleString('fa-IR')} لیست
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Link
                      href={`/admin/catalog/${selectedDetail}/edit`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      ویرایش کاتالوگ
                    </Link>
                    <button
                      type="button"
                      onClick={() => setAddModalOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      افزودن به لیست
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mt-4 mb-2">جایگاه‌ها</p>
                  <ul className="space-y-2 max-h-[240px] overflow-y-auto">
                    {detail.placements.map((p) => (
                      <li
                        key={p.itemId}
                        className="rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-gray-800 truncate">{p.listTitle}</p>
                        <div className="flex gap-3 mt-1.5">
                          <Link
                            href={`/admin/items/${p.itemId}/edit`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:underline"
                          >
                            یادداشت لیست
                          </Link>
                          <Link
                            href={`/lists/${p.listSlug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                            مشاهده
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="p-4 text-sm text-red-600">بارگذاری جزئیات ناموفق بود</p>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* موبایل: overlay */}
      {selectedDetail && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => {
            setSelectedDetail(null);
            setDetail(null);
          }}
          aria-hidden
        />
      )}

      {selectedDetail && detail && (
        <AddToListModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          catalogId={selectedDetail}
          catalogTitle={detail.title}
          lists={lists}
          existingListIds={detail.placements.map((p) => p.listId)}
          onSuccess={(listTitle) => {
            setMessage(`به «${listTitle}» اضافه شد`);
            void openDetail(selectedDetail);
            void loadBrowse(page, query, category);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
