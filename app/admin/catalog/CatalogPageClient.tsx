'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  FileJson,
  Info,
  X,
  ListPlus,
  Layers,
  Filter,
  RotateCcw,
  Link2,
  Check,
  Loader2,
} from 'lucide-react';
import NewItemForm, { type NewItemFormList } from '@/app/admin/items/new/NewItemForm';
import AddToListModal from '@/components/admin/catalog/AddToListModal';
import CatalogPlacementPanel from '@/components/admin/catalog/CatalogPlacementPanel';
import CatalogBulkToolbar from '@/components/admin/catalog/CatalogBulkToolbar';
import CatalogDuplicateMergeTab from '@/components/admin/catalog/CatalogDuplicateMergeTab';
import CatalogSimilarMergePanel from '@/components/admin/catalog/CatalogSimilarMergePanel';
import CatalogVisibilityControl from '@/components/admin/catalog/CatalogVisibilityControl';
import ExternalImageItemsModal from '@/components/admin/items/ExternalImageItemsModal';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import {
  catalogCategoryLabel,
  formatExternalKeyHint,
} from '@/lib/catalog-display';
import {
  pickSuggestedMergeTarget,
  type CatalogCategoryFilter,
  type CatalogListFilter,
  type CatalogListRow,
  type DuplicateCatalogGroup,
  type SimilarCatalogRow,
} from '@/lib/catalog-items';
import type { CatalogPageMode, CatalogPlacementList } from '@/lib/admin/catalog-page-data';

type Tab = 'browse' | 'duplicates';

type ListOption = { id: string; title: string; icon?: string | null };
interface CatalogPageClientProps {
  initialTab: Tab;
  initialMode?: CatalogPageMode;
  placementList?: CatalogPlacementList | null;
  initialRows: CatalogListRow[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialQuery: string;
  initialCategory: string;
  initialListId: string;
  initialMultiListOnly: boolean;
  initialMultiListCount: number;
  initialCategoryFilters: { total: number; categories: CatalogCategoryFilter[] };
  initialListFilters: CatalogListFilter[];
  initialDuplicateGroups: DuplicateCatalogGroup[];
  lists: ListOption[];
  embedded?: boolean;
  basePath?: string;
  viewParam?: string;
  createLists?: NewItemFormList[];
  initialCreateListId?: string;
}

export default function CatalogPageClient({
  initialTab,
  initialMode = 'browse',
  placementList = null,
  initialRows,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialQuery,
  initialCategory,
  initialListId,
  initialMultiListOnly,
  initialMultiListCount,
  initialCategoryFilters,
  initialListFilters,
  initialDuplicateGroups,
  lists,
  embedded = false,
  basePath = '/admin/catalog',
  viewParam,
  createLists,
  initialCreateListId,
}: CatalogPageClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [listId, setListId] = useState(initialListId);
  const [multiListOnly, setMultiListOnly] = useState(initialMultiListOnly);
  const [listFilters, setListFilters] = useState(initialListFilters);
  const [multiListCount, setMultiListCount] = useState(initialMultiListCount);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [groups, setGroups] = useState(initialDuplicateGroups);
  const [dupCount, setDupCount] = useState(initialDuplicateGroups.length);
  const [mergeLoading, setMergeLoading] = useState<string | null>(null);
  const [similarMergeLoading, setSimilarMergeLoading] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<Record<string, string>>({});
  const [similarQuery, setSimilarQuery] = useState('');
  const [similarItems, setSimilarItems] = useState<SimilarCatalogRow[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [detailSimilarItems, setDetailSimilarItems] = useState<SimilarCatalogRow[]>([]);
  const [detailSimilarLoading, setDetailSimilarLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{
    title: string;
    categorySlug: string | null;
    placements: { itemId: string; listId: string; listTitle: string; listSlug: string }[];
    isDisabled: boolean;
  } | null>(null);
  const [externalImagesOpen, setExternalImagesOpen] = useState(false);
  const [wrappingProxy, setWrappingProxy] = useState(false);
  const placementMode = initialMode === 'place';
  const createMode = initialMode === 'create';
  const [activePlacementListId, setActivePlacementListId] = useState(
    placementList?.id ?? initialCreateListId ?? ''
  );
  const [addingCatalogId, setAddingCatalogId] = useState<string | null>(null);
  const [placedCatalogIds, setPlacedCatalogIds] = useState<Set<string>>(
    () => new Set(initialRows.filter((r) => r.alreadyInList).map((r) => r.id))
  );

  useEffect(() => {
    setPlacedCatalogIds(
      new Set(rows.filter((r) => r.alreadyInList).map((r) => r.id))
    );
  }, [rows]);
  const activePlacementMeta =
    lists.find((l) => l.id === activePlacementListId) ??
    (placementList
      ? {
          id: placementList.id,
          title: placementList.title,
          icon: placementList.icon,
        }
      : null);

  const pushUrl = useCallback(
    (next: {
      tab?: Tab;
      page?: number;
      q?: string;
      category?: string;
      listId?: string;
      multiListOnly?: boolean;
      placementListId?: string;
    }) => {
      const p = new URLSearchParams();
      const t = next.tab ?? tab;
      if (t === 'duplicates') p.set('tab', 'duplicates');
      if ((next.q ?? query).trim()) p.set('q', (next.q ?? query).trim());
      const cat = next.category !== undefined ? next.category : category;
      if (cat) p.set('category', cat);
      if (createMode) {
        p.set('mode', 'create');
        const plid =
          next.placementListId !== undefined ? next.placementListId : activePlacementListId;
        if (plid) p.set('listId', plid);
      } else if (placementMode) {
        p.set('mode', 'place');
        const plid =
          next.placementListId !== undefined ? next.placementListId : activePlacementListId;
        if (plid) p.set('listId', plid);
      } else {
        const lid = next.listId !== undefined ? next.listId : listId;
        if (lid) p.set('listId', lid);
      }
      const multi = next.multiListOnly !== undefined ? next.multiListOnly : multiListOnly;
      if (multi) p.set('multiList', '1');
      if (t === 'browse') p.set('page', String(next.page ?? page));
      if (viewParam) p.set('view', viewParam);
      router.push(`${basePath}?${p.toString()}`);
    },
    [
      router,
      tab,
      query,
      page,
      category,
      listId,
      multiListOnly,
      basePath,
      viewParam,
      placementMode,
      createMode,
      activePlacementListId,
    ]
  );

  const handleQuickPlace = async (row: CatalogListRow) => {
    if (!activePlacementListId || placedCatalogIds.has(row.id)) return;
    setAddingCatalogId(row.id);
    setMessage('');
    try {
      const res = await fetch('/api/admin/items/add-to-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogItemId: row.id, listId: activePlacementListId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در افزودن');
      setPlacedCatalogIds((prev) => new Set(prev).add(row.id));
      setMessage(`«${row.title}» به لیست اضافه شد`);
      router.refresh();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'خطا در افزودن');
    } finally {
      setAddingCatalogId(null);
    }
  };

  const handlePlacementListChange = (nextId: string) => {
    setActivePlacementListId(nextId);
    pushUrl({ placementListId: nextId });
  };

  const refreshFilterMeta = useCallback(async (nextCategory: string, nextListId: string) => {
    try {
      const p = new URLSearchParams();
      if (nextCategory) p.set('categorySlug', nextCategory);
      if (nextListId) p.set('listId', nextListId);
      const res = await fetch(`/api/admin/catalog-items/filters?${p}`);
      const data = await res.json();
      if (!res.ok) return;
      setListFilters(data.listFilters ?? []);
      setMultiListCount(data.multiListCount ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadBrowse = async (
    nextPage: number,
    nextQ: string,
    nextCategory = category,
    nextListId = listId,
    nextMultiListOnly = multiListOnly
  ) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(nextPage), perPage: '24' });
      if (nextQ.trim()) p.set('q', nextQ.trim());
      if (nextCategory) p.set('categorySlug', nextCategory);
      if (nextListId) p.set('listId', nextListId);
      if (placementMode && activePlacementListId) {
        p.set('placementListId', activePlacementListId);
      }
      if (nextMultiListOnly) p.set('multiList', '1');
      const res = await fetch(`/api/admin/catalog-items?${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows(data.rows);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setSelectedIds(new Set());
      void refreshFilterMeta(nextCategory, nextListId);
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
        defaults[group.groupKey] = pickSuggestedMergeTarget(group.catalogs);
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

  const markCatalogDisabled = useCallback((catalogId: string, disabled: boolean) => {
    setRows((prev) =>
      prev.map((row) => (row.id === catalogId ? { ...row, isDisabled: disabled } : row))
    );
    setDetail((prev) =>
      prev && selectedDetail === catalogId ? { ...prev, isDisabled: disabled } : prev
    );
  }, [selectedDetail]);

  const openDetail = async (catalogId: string) => {
    setSelectedDetail(catalogId);
    setDetail(null);
    setDetailSimilarItems([]);
    setDetailLoading(true);
    setDetailSimilarLoading(true);
    try {
      const [detailRes, similarRes] = await Promise.all([
        fetch(`/api/admin/catalog-items/${catalogId}`),
        fetch(`/api/admin/catalog-items/similar?catalogId=${encodeURIComponent(catalogId)}&limit=12`),
      ]);
      const data = await detailRes.json();
      if (!detailRes.ok) throw new Error(data.error);
      setDetail({
        title: data.title,
        categorySlug: data.categorySlug ?? null,
        placements: data.placements ?? [],
        isDisabled: Boolean(data.isDisabled),
      });

      const similarData = await similarRes.json();
      if (similarRes.ok) {
        setDetailSimilarItems(similarData.rows ?? []);
      }
    } catch {
      setDetail(null);
      setDetailSimilarItems([]);
    } finally {
      setDetailLoading(false);
      setDetailSimilarLoading(false);
    }
  };

  const loadSimilarSearch = async (rawQ: string) => {
    const q = rawQ.trim();
    if (q.length < 2) {
      setSimilarItems([]);
      return;
    }
    setSimilarLoading(true);
    setMessage('');
    try {
      const params = new URLSearchParams({ q, limit: '24' });
      if (category) params.set('categorySlug', category);
      const res = await fetch(`/api/admin/catalog-items/similar?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSimilarItems(data.rows ?? []);
    } catch (e: unknown) {
      setSimilarItems([]);
      setMessage(e instanceof Error ? e.message : 'خطا در جستجوی مشابه');
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleSimilarMerge = async (targetCatalogId: string, sourceCatalogIds: string[]) => {
    const sources = sourceCatalogIds.filter((id) => id && id !== targetCatalogId);
    if (sources.length === 0) return;

    setSimilarMergeLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/catalog-items/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCatalogId, sourceCatalogIds: sources }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message ?? 'ادغام انجام شد');

      setSimilarItems((prev) => prev.filter((item) => !sources.includes(item.id)));
      setDetailSimilarItems((prev) => prev.filter((item) => !sources.includes(item.id)));
      setGroups((prev) =>
        prev
          .map((group) => ({
            ...group,
            catalogs: group.catalogs.filter((c) => !sources.includes(c.id)),
          }))
          .filter((group) => group.catalogs.length >= 2)
      );
      setDupCount((c) => Math.max(0, c - 1));

      if (sources.includes(selectedDetail ?? '')) {
        setSelectedDetail(null);
        setDetail(null);
      } else if (selectedDetail === targetCatalogId) {
        void openDetail(targetCatalogId);
      }

      if (tab === 'browse') void loadBrowse(page, query, category, listId, multiListOnly);
      router.refresh();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'خطا در ادغام');
    } finally {
      setSimilarMergeLoading(false);
    }
  };

  const handleWrapImageProxy = async () => {
    const scopeParts: string[] = [];
    if (category) scopeParts.push(`دسته ${category}`);
    if (listId) {
      const listTitle = listFilters.find((l) => l.id === listId)?.title ?? listId;
      scopeParts.push(`لیست «${listTitle}»`);
    }
    if (multiListOnly) scopeParts.push('فقط چندلیستی');
    const scopeLabel = scopeParts.length > 0 ? scopeParts.join(' · ') : 'همه موجودیت‌ها';

    setWrappingProxy(true);
    setMessage('');
    try {
      const params = new URLSearchParams();
      if (category) params.set('categorySlug', category);
      if (listId) params.set('listId', listId);
      if (multiListOnly) params.set('multiListOnly', '1');

      const previewRes = await fetch(`/api/admin/catalog/wrap-image-proxy?${params.toString()}`);
      const preview = await previewRes.json();
      if (!previewRes.ok || !preview.success) {
        throw new Error(preview.error || 'خطا در شمارش');
      }

      if (preview.count === 0) {
        setMessage(
          `همه ${preview.totalInScope.toLocaleString('fa-IR')} موجودیت از قبل روی ParsPack یا پراکسی هستند.`
        );
        return;
      }

      const sampleTitles = (preview.samples as { title: string }[])
        .slice(0, 3)
        .map((s) => s.title)
        .join('، ');

      const confirmMsg = [
        `${preview.count.toLocaleString('fa-IR')} تصویر در ${scopeLabel} بدون پراکسی هستند.`,
        sampleTitles ? `نمونه: ${sampleTitles}` : null,
        '',
        'آدرس castando proxy به imageUrl در DB اضافه شود؟',
      ]
        .filter(Boolean)
        .join('\n');

      if (!confirm(confirmMsg)) return;

      const res = await fetch('/api/admin/catalog/wrap-image-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySlug: category || undefined,
          listId: listId || undefined,
          multiListOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'اعمال پراکسی ناموفق');
      setMessage(data.message || 'پراکسی در DB ذخیره شد');
      void loadBrowse(page, query, category, listId, multiListOnly);
      router.refresh();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'خطا در اعمال پراکسی');
    } finally {
      setWrappingProxy(false);
    }
  };

  const handleMergeGroup = async (group: DuplicateCatalogGroup) => {
    const targetId = mergeTarget[group.groupKey] || pickSuggestedMergeTarget(group.catalogs);
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
      if (tab === 'browse') void loadBrowse(page, query, category, listId, multiListOnly);
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
    setListId('');
    setSelectedIds(new Set());
    pushUrl({ category: slug, listId: '', page: 1 });
    void loadBrowse(1, query, slug, '', multiListOnly);
    void refreshFilterMeta(slug, '');
  };

  const setListFilter = (nextListId: string) => {
    setListId(nextListId);
    setPage(1);
    setSelectedIds(new Set());
    pushUrl({ listId: nextListId, page: 1 });
    void loadBrowse(1, query, category, nextListId, multiListOnly);
    void refreshFilterMeta(category, nextListId);
  };

  const toggleMultiListFilter = () => {
    const next = !multiListOnly;
    setMultiListOnly(next);
    setPage(1);
    setSelectedIds(new Set());
    pushUrl({ multiListOnly: next, page: 1 });
    void loadBrowse(1, query, category, listId, next);
  };

  const clearAdvancedFilters = () => {
    setListId('');
    setMultiListOnly(false);
    setPage(1);
    setSelectedIds(new Set());
    pushUrl({ listId: '', multiListOnly: false, page: 1 });
    void loadBrowse(1, query, category, '', false);
    void refreshFilterMeta(category, '');
  };

  const hasAdvancedFilters = Boolean(listId || multiListOnly);
  const activeCategoryLabel = category
    ? catalogCategoryLabel(category === '__none__' ? null : category)
    : null;
  const listFilterOptions = category ? listFilters : listFilters.filter((l) => l.count > 0);

  const externalImagesScopeTitle = useMemo(() => {
    const parts: string[] = [];
    if (category) parts.push(activeCategoryLabel ?? 'دسته');
    if (listId) {
      const list = listFilters.find((l) => l.id === listId);
      if (list) parts.push(list.title);
    }
    if (multiListOnly) parts.push('فقط چندلیستی');
    return parts.length ? parts.join(' · ') : 'همه کاتالوگ';
  }, [category, listId, multiListOnly, activeCategoryLabel, listFilters]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    const pageIds = rows.map((r) => r.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const selectedTitles = rows
    .filter((r) => selectedIds.has(r.id))
    .map((r) => r.title);

  const { total: catalogTotal, categories: categoryChips } = initialCategoryFilters;
  const allPageSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  if (createMode && createLists && createLists.length > 0) {
    const targetListId = initialCreateListId ?? activePlacementListId;
    const placeHref = targetListId
      ? `/admin/lists?view=catalog&mode=place&listId=${targetListId}`
      : '/admin/lists?view=catalog&mode=place';
    const workspaceHref = targetListId ? `/admin/lists/${targetListId}` : undefined;
    const targetMeta = createLists.find((l) => l.id === targetListId);

    return (
      <div className={embedded ? 'pb-4' : 'pb-8'} dir="rtl">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-l from-violet-50/80 to-white px-4 py-3.5 mb-5">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              {workspaceHref && (
                <Link
                  href={workspaceHref}
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-900 mb-1"
                >
                  بازگشت به workspace
                </Link>
              )}
              <h2 className="text-base font-bold text-gray-900">ساخت موجودیت جدید</h2>
              {targetMeta && (
                <p className="text-xs text-gray-600 mt-0.5">
                  مقصد: {targetMeta.categories?.icon || '📋'} {targetMeta.title}
                </p>
              )}
            </div>
            <Link
              href={placeHref}
              className="text-sm font-semibold text-violet-700 hover:text-violet-900 underline-offset-2 hover:underline"
            >
              از کاتالوگ انتخاب کنید
            </Link>
          </div>
        </div>
        <NewItemForm
          lists={createLists}
          initialListId={targetListId}
          embedded
          formOnly
        />
      </div>
    );
  }

  return (
    <div className={embedded ? 'pb-4' : 'pb-8'} dir="rtl">
      {!embedded && (
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
            href="/admin/lists?view=import"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50"
          >
            <FileJson className="w-4 h-4" />
            import گروهی
          </Link>
          <Link
            href="/admin/lists?view=catalog"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            بر اساس لیست
          </Link>
          <Link
            href="/admin/lists?view=catalog&mode=place"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            افزودن به لیست
          </Link>
        </div>
      </div>
      )}

      {embedded && !placementMode && (
        <p className="text-sm text-gray-500 mb-4">
          {total.toLocaleString('fa-IR')} موجودیت در کاتالوگ
          {initialMultiListCount > 0 && (
            <span className="text-violet-700 font-medium">
              {' '}
              · {initialMultiListCount.toLocaleString('fa-IR')} چندلیستی
            </span>
          )}
        </p>
      )}

      {placementMode && (
        <CatalogPlacementPanel
          listId={activePlacementListId}
          listTitle={activePlacementMeta?.title}
          listIcon={activePlacementMeta?.icon}
          categorySlug={placementList?.categorySlug ?? undefined}
          lists={lists}
          workspaceHref={
            activePlacementListId ? `/admin/lists/${activePlacementListId}` : undefined
          }
          onListChange={handlePlacementListChange}
        />
      )}

      {placementMode && (
        <p className="text-xs font-semibold text-gray-500 mb-3 mt-2">یا از کاتالوگ مرور کنید</p>
      )}

      {!embedded && (
      <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          هر کارت اینجا <strong>یک موجودیت</strong> است (مثلاً یک فیلم). با کلیک ببینید در کدام
          لیست‌ها است. ویرایش عنوان/تصویر از یک جایگاه، همهٔ لیست‌ها را به‌روز می‌کند.
        </p>
      </div>
      )}

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
            message.includes('خطا') ||
            message.includes('ناموفق') ||
            message.includes('Error')
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
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

              <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Filter className="w-4 h-4 text-violet-600" />
                    فیلتر پیشرفته
                    {activeCategoryLabel && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        {activeCategoryLabel}
                      </span>
                    )}
                  </div>
                  {hasAdvancedFilters && (
                    <button
                      type="button"
                      onClick={clearAdvancedFilters}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-violet-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      پاک کردن فیلترها
                    </button>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row gap-2">
                  {!placementMode && (
                  <label className="flex-1 min-w-[200px]">
                    <span className="block text-[11px] font-semibold text-gray-500 mb-1">
                      {category ? `لیست‌های دارای ${activeCategoryLabel}` : 'فیلتر بر اساس لیست'}
                    </span>
                    <select
                      value={listId}
                      onChange={(e) => setListFilter(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                    >
                      <option value="">
                        {category
                          ? `همهٔ ${activeCategoryLabel ?? 'دسته'} (${total.toLocaleString('fa-IR')} نتیجه)`
                          : `همه لیست‌ها (${catalogTotal.toLocaleString('fa-IR')})`}
                      </option>
                      {listFilterOptions.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.icon || '📋'} {l.title} ({l.count.toLocaleString('fa-IR')})
                        </option>
                      ))}
                    </select>
                  </label>
                  )}

                  <div className="flex flex-wrap items-end gap-2">
                    <Link
                      href={`${basePath}?view=${viewParam ?? 'catalog'}&mode=create`}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      آیتم جدید
                    </Link>
                    <button
                      type="button"
                      onClick={() => setExternalImagesOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                      title="موجودیت‌هایی که poster هنوز روی ParsPack نیست — شامل banner و URLهای بدون parspack"
                    >
                      <Link2 className="w-4 h-4" />
                      S3
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleWrapImageProxy()}
                      disabled={wrappingProxy}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-900 transition-colors hover:bg-sky-100 disabled:opacity-50"
                      title="افزودن پراکسی castando به تصاویر خارج از ParsPack"
                    >
                      {wrappingProxy ? '…' : '🔗'}
                      پراکسی
                    </button>
                    <button
                      type="button"
                      onClick={toggleMultiListFilter}
                      disabled={multiListCount === 0 && !multiListOnly}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                        multiListOnly
                          ? 'border-amber-400 bg-amber-50 text-amber-900'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-amber-300 hover:bg-amber-50/60'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <Layers className="w-4 h-4" />
                      فقط چندلیستی
                      {multiListCount > 0 && (
                        <span
                          className={`rounded-full text-[10px] min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center ${
                            multiListOnly ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {multiListCount.toLocaleString('fa-IR')}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {!category && (
                  <p className="text-[11px] text-gray-500">
                    برای فیلتر دقیق‌تر، ابتدا یک دسته (مثل فیلم) انتخاب کنید — لیست‌ها و تعداد
                    چندلیستی‌ها بر اساس همان دسته محاسبه می‌شود.
                  </p>
                )}
              </div>

              {selectedIds.size > 0 && (
                <CatalogBulkToolbar
                  selectedIds={[...selectedIds]}
                  selectedTitles={selectedTitles}
                  lists={listFilters.map((l) => ({ id: l.id, title: l.title, icon: l.icon }))}
                  activeListId={listId}
                  onClear={() => setSelectedIds(new Set())}
                  onDone={(msg) => {
                    setMessage(msg);
                    void loadBrowse(page, query, category, listId, multiListOnly);
                    router.refresh();
                  }}
                  onError={(msg) => setMessage(`خطا: ${msg}`)}
                />
              )}

              <form
                className="flex flex-col sm:flex-row gap-2 mb-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  pushUrl({ page: 1, q: query });
                  void loadBrowse(1, query, category, listId, multiListOnly);
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

              {rows.length > 0 && !loading && (
                <label className="inline-flex items-center gap-2 mb-3 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllPage}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  انتخاب همه در این صفحه
                </label>
              )}

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
                    href="/admin/lists?view=catalog&mode=place"
                    className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن از کاتالوگ
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {rows.map((row) => {
                    const extHint = formatExternalKeyHint(row.externalKey);
                    const isSelected = selectedIds.has(row.id);
                    const isMultiList = row.listCount > 1;
                    const isDisabled = Boolean(row.isDisabled);
                    return (
                      <div
                        key={row.id}
                        className={`group relative text-right rounded-xl border p-3 transition-all hover:shadow-md ${
                          selectedDetail === row.id
                            ? 'border-violet-500 bg-violet-50/50 ring-2 ring-violet-200'
                            : isSelected
                              ? 'border-violet-400 bg-violet-50/40'
                              : isDisabled
                                ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                                : isMultiList
                                  ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
                                  : 'border-gray-200 bg-white hover:border-violet-200'
                        }`}
                      >
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                          <label className="cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(row.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 w-4 h-4"
                              aria-label={`انتخاب ${row.title}`}
                            />
                          </label>
                          <CatalogVisibilityControl
                            catalogId={row.id}
                            isDisabled={isDisabled}
                            variant="compact"
                            onChanged={(disabled) => markCatalogDisabled(row.id, disabled)}
                            onError={setMessage}
                          />
                        </div>
                        {placementMode && activePlacementListId && (
                          <div className="absolute bottom-2 left-2 z-10">
                            {placedCatalogIds.has(row.id) ? (
                              <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800">
                                <Check className="w-3 h-3" />
                                موجود
                              </span>
                            ) : (
                              <button
                                type="button"
                                title={`افزودن «${row.title}» به لیست`}
                                disabled={addingCatalogId === row.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleQuickPlace(row);
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600 text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                              >
                                {addingCatalogId === row.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openDetail(row.id)}
                          className="w-full text-right"
                        >
                          <div className="flex gap-3 items-center pr-0 pl-6">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 ring-1 ring-black/5">
                              <ImageWithFallback
                                src={row.imageUrl ?? ''}
                                alt=""
                                className="w-full h-full object-cover"
                                fallbackIcon="📋"
                                preferStoredImage
                                categorySlug={row.categorySlug}
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
                                <span
                                  className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    isMultiList
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {isMultiList && <ListPlus className="w-3 h-3" />}
                                  {row.listCount.toLocaleString('fa-IR')} لیست
                                </span>
                                {row.hasSearchProfile && (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800"
                                    title="پروفایل جستجو ساخته شده"
                                  >
                                    🔍 جستجو
                                  </span>
                                )}
                                {isDisabled && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    غیرفعال
                                  </span>
                                )}
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
                      </div>
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
                      void loadBrowse(np, query, category, listId, multiListOnly);
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
                      void loadBrowse(np, query, category, listId, multiListOnly);
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
            <CatalogDuplicateMergeTab
              groups={groups}
              loading={loading}
              mergeLoadingKey={mergeLoading}
              mergeTarget={mergeTarget}
              onMergeTargetChange={(groupKey, catalogId) =>
                setMergeTarget((p) => ({ ...p, [groupKey]: catalogId }))
              }
              onMergeGroup={handleMergeGroup}
              similarQuery={similarQuery}
              onSimilarQueryChange={setSimilarQuery}
              onSimilarSearch={() => void loadSimilarSearch(similarQuery)}
              similarItems={similarItems}
              similarLoading={similarLoading}
              similarMergeLoading={similarMergeLoading}
              onSimilarMerge={handleSimilarMerge}
            />
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
                        preferStoredImage
                        categorySlug={detail.categorySlug}
                      />
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 leading-snug">{detail.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {catalogCategoryLabel(detail.categorySlug)} ·{' '}
                    {detail.placements.length.toLocaleString('fa-IR')} لیست
                  </p>

                  <CatalogVisibilityControl
                    catalogId={selectedDetail}
                    isDisabled={detail.isDisabled}
                    placementCount={detail.placements.length}
                    onChanged={(disabled) => markCatalogDisabled(selectedDetail, disabled)}
                    onError={setMessage}
                    className="mt-4"
                  />

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

                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5 text-violet-600" />
                      موارد مشابه
                    </h4>
                    <CatalogSimilarMergePanel
                      items={detailSimilarItems}
                      loading={detailSimilarLoading}
                      mergeLoading={similarMergeLoading}
                      fixedTargetId={selectedDetail}
                      fixedTargetTitle={detail.title}
                      onMerge={handleSimilarMerge}
                      emptyMessage="مورد مشابه دیگری در کاتالوگ نیست"
                    />
                  </div>
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
            void loadBrowse(page, query, category, listId);
            router.refresh();
          }}
        />
      )}

      {tab === 'browse' && (
        <ExternalImageItemsModal
          isOpen={externalImagesOpen}
          onClose={() => setExternalImagesOpen(false)}
          mode="catalog"
          scopeTitle={externalImagesScopeTitle}
          catalogFilters={{
            categorySlug: category || undefined,
            listId: listId || undefined,
            multiListOnly,
          }}
          onMigrated={() => {
            void loadBrowse(page, query, category, listId, multiListOnly);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
