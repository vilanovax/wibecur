'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Square,
  X,
} from 'lucide-react';
import Toast, { type ToastType } from '@/components/shared/Toast';
import {
  buildExternalItemTipAiPrompt,
  buildItemTipExportPayload,
  type ItemTipRow,
  type ItemTipsPageData,
} from '@/lib/admin/item-tip-import';
import {
  hydrateItemTipReviewedIds,
  isItemTipReviewed,
  markItemTipReviewed,
  markManyItemTipsReviewed,
  syncItemTipReviewedIds,
  unmarkItemTipReviewed,
  getReviewedItemTipIds,
} from '@/lib/admin/item-tip-review-storage';
import {
  INITIAL_BULK_IMPORT_PROGRESS,
  runBatchedJsonImport,
  type BulkImportProgress,
} from '@/lib/admin/bulk-json-import-client';

const ItemTipImportModal = dynamic(() => import('@/components/admin/lists/ItemTipImportModal'));

const PAGE_SIZE = 15;
const TIP_MAX = 500;

type Props = {
  data: ItemTipsPageData;
  embedded?: boolean;
};

type SaveState = 'idle' | 'saving' | 'error';
type TipSort = 'list' | 'title' | 'missing' | 'shortest' | 'longest';

function normalizeSearch(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function faCount(value: number): string {
  return value.toLocaleString('fa-IR');
}

function sortItems(rows: ItemTipRow[], sort: TipSort): ItemTipRow[] {
  if (sort === 'list') return rows;
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title, 'fa');
    if (sort === 'missing') {
      const emptyA = (a.tip ?? '').trim() ? 1 : 0;
      const emptyB = (b.tip ?? '').trim() ? 1 : 0;
      if (emptyA !== emptyB) return emptyA - emptyB;
      return a.title.localeCompare(b.title, 'fa');
    }
    const delta = (a.tip ?? '').trim().length - (b.tip ?? '').trim().length;
    if (delta !== 0) return sort === 'shortest' ? delta : -delta;
    return a.title.localeCompare(b.title, 'fa');
  });
  return copy;
}

export default function ItemTipsClient({ data, embedded = false }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ItemTipRow[]>(data.items);
  const [categoryId, setCategoryId] = useState(data.initialCategoryId);
  const [listId, setListId] = useState(data.initialListId);
  const [search, setSearch] = useState('');
  const [showReviewed, setShowReviewed] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);
  const [sort, setSort] = useState<TipSort>('list');
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<BulkImportProgress>(INITIAL_BULK_IMPORT_PROGRESS);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    setItems(data.items);
    setCategoryId(data.initialCategoryId);
    setListId(data.initialListId);
    setSelectedIds(new Set());
    setEditingId(null);
    setEditValue('');
    setPage(1);
  }, [data]);

  const hydrateDoneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let base = getReviewedItemTipIds();
      if (!hydrateDoneRef.current) {
        base = await hydrateItemTipReviewedIds(base);
        hydrateDoneRef.current = true;
      }
      const synced = syncItemTipReviewedIds(data.items);
      const merged = new Set([...base, ...synced]);
      if (!cancelled) setReviewedIds(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [data.items]);

  useEffect(() => {
    setPage(1);
  }, [search, showReviewed, missingOnly, sort]);

  const listsInCategory = useMemo(() => {
    if (!categoryId) return data.lists;
    return data.lists.filter((list) => list.categoryId === categoryId);
  }, [categoryId, data.lists]);

  const scopeLabel = useMemo(() => {
    if (listId) {
      const list = data.lists.find((row) => row.id === listId);
      return list ? list.title : 'لیست';
    }
    if (categoryId) {
      return data.categories.find((cat) => cat.id === categoryId)?.name ?? 'دسته';
    }
    return 'همه';
  }, [listId, categoryId, data.lists, data.categories]);

  const filteredItems = useMemo(() => {
    const q = normalizeSearch(search);
    const matched = items.filter((item) => {
      const reviewed = isItemTipReviewed(item, reviewedIds);
      if (!showReviewed && reviewed) return false;
      if (showReviewed && !reviewed) return false;
      if (missingOnly && (item.tip ?? '').trim()) return false;
      if (!q) return true;
      return (
        normalizeSearch(item.title).includes(q) ||
        normalizeSearch(item.listTitle).includes(q) ||
        normalizeSearch(item.tip ?? '').includes(q)
      );
    });
    return sortItems(matched, sort);
  }, [items, search, reviewedIds, showReviewed, missingOnly, sort]);

  const reviewedInScope = useMemo(
    () => items.filter((item) => isItemTipReviewed(item, reviewedIds)).length,
    [items, reviewedIds]
  );

  const pendingCount = items.length - reviewedInScope;
  const missingCount = useMemo(
    () =>
      items.filter((item) => !isItemTipReviewed(item, reviewedIds) && !(item.tip ?? '').trim())
        .length,
    [items, reviewedIds]
  );

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const isDirty = useCallback(
    (item: ItemTipRow) =>
      editingId === item.id && editValue.trim() !== (item.tip ?? '').trim(),
    [editingId, editValue]
  );

  const applyScope = (nextCategoryId: string, nextListId: string) => {
    const params = new URLSearchParams();
    params.set('view', 'item-tips');
    if (nextListId) params.set('tipsList', nextListId);
    else if (nextCategoryId) params.set('tipsCategory', nextCategoryId);
    router.push(`/admin/lists?${params.toString()}`);
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((item) => next.delete(item.id));
        return next;
      });
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closeEditor = () => {
    setEditingId(null);
    setEditValue('');
    setSaveState('idle');
  };

  const openEditor = (item: ItemTipRow) => {
    if (editingId && editingId !== item.id) {
      const current = items.find((row) => row.id === editingId);
      if (current && editValue.trim() !== (current.tip ?? '').trim()) {
        setToast({ message: 'اول نکتهٔ باز را ذخیره یا لغو کنید', type: 'error' });
        return;
      }
    }
    setEditingId(item.id);
    setEditValue(item.tip ?? '');
    setSaveState('idle');
  };

  const saveTip = async (item: ItemTipRow, silent = false) => {
    const nextTip = editValue.trim() || null;
    if (nextTip && nextTip.length > TIP_MAX) {
      setToast({ message: 'نکته نباید بیشتر از ۵۰۰ نویسه باشد', type: 'error' });
      return false;
    }
    if ((item.tip ?? null) === nextTip) {
      closeEditor();
      return true;
    }

    setSaveState('saving');
    try {
      const res = await fetch(`/api/admin/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip: nextTip }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'خطا در ذخیره');

      setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, tip: nextTip } : row)));
      closeEditor();
      if (!silent) setToast({ message: 'نکته ذخیره شد', type: 'success' });
      return true;
    } catch (error) {
      setSaveState('error');
      if (!silent) {
        setToast({
          message: error instanceof Error ? error.message : 'خطا در ذخیره نکته',
          type: 'error',
        });
      }
      return false;
    }
  };

  const markReviewed = async (item: ItemTipRow) => {
    if (editingId === item.id && isDirty(item)) {
      const saved = await saveTip(item, true);
      if (!saved) {
        setToast({ message: 'ابتدا نکته را ذخیره کنید', type: 'error' });
        return;
      }
    } else if (editingId === item.id) {
      closeEditor();
    }
    setReviewedIds(markItemTipReviewed(item));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    setToast({ message: 'از صف بررسی خارج شد', type: 'success' });
  };

  const markSelectedReviewed = async () => {
    const targets = items.filter(
      (item) => selectedIds.has(item.id) && !isItemTipReviewed(item, reviewedIds)
    );
    if (targets.length === 0) return;

    const open = targets.find((item) => item.id === editingId);
    if (open && isDirty(open)) {
      const saved = await saveTip(open, true);
      if (!saved) {
        setToast({ message: `ذخیره «${open.title}» ناموفق بود`, type: 'error' });
        return;
      }
    }

    setReviewedIds(markManyItemTipsReviewed(targets));
    setSelectedIds(new Set());
    if (editingId && targets.some((item) => item.id === editingId)) closeEditor();
    setToast({
      message: `${faCount(targets.length)} آیتم از صف خارج شد`,
      type: 'success',
    });
  };

  const exportItems = (rows: ItemTipRow[]) => {
    const payload = buildItemTipExportPayload(rows);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `item-tips-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyAiPrompt = async (rows: ItemTipRow[]) => {
    const payload = buildItemTipExportPayload(rows);
    const prompt = buildExternalItemTipAiPrompt(payload.items);
    await navigator.clipboard.writeText(prompt);
    setToast({ message: 'پرامپت و JSON برای هوش مصنوعی کپی شد', type: 'success' });
  };

  const handleImport = async (payload: { items: { id: string; tip: string | null }[] }) => {
    setImporting(true);
    setImportProgress({ ...INITIAL_BULK_IMPORT_PROGRESS, total: payload.items.length });
    try {
      const result = await runBatchedJsonImport({
        items: payload.items,
        endpoint: '/api/admin/items/import-tips',
        buildBody: (batch) => ({ items: batch }),
        onProgress: setImportProgress,
      });

      const byId = new Map(payload.items.map((item) => [item.id, item]));
      setItems((prev) =>
        prev.map((item) => {
          const imported = byId.get(item.id);
          if (!imported) return item;
          return { ...item, tip: imported.tip?.trim() || null };
        })
      );
      closeEditor();
      setToast({
        message: `${faCount(result.updated)} نکته به‌روز شد · ${faCount(result.skipped)} بدون تغییر${
          result.failed > 0 ? ` · ${faCount(result.failed)} خطا` : ''
        }`,
        type: result.failed > 0 ? 'error' : 'success',
      });
      router.refresh();
    } catch (error) {
      setImportProgress(INITIAL_BULK_IMPORT_PROGRESS);
      setToast({
        message: error instanceof Error ? error.message : 'خطا در ورود',
        type: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    if (importing) return;
    setImportOpen(false);
    setImportProgress(INITIAL_BULK_IMPORT_PROGRESS);
  };

  const exportTarget = selectedItems.length > 0 ? selectedItems : filteredItems;
  const tooLong = editValue.trim().length > TIP_MAX;

  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">نکته‌های آیتم</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            برای هر آیتم یک نکتهٔ کوتاه. ویرایش را بزنید و بعد ذخیره کنید.
          </p>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            {faCount(pendingCount)} نیاز به بررسی
          </span>
          <button
            type="button"
            onClick={() => setMissingOnly((value) => !value)}
            className={`min-h-11 rounded-full px-3 text-xs font-semibold ring-1 ${
              missingOnly
                ? 'bg-violet-600 text-white ring-violet-600'
                : 'bg-violet-50 text-violet-900 ring-violet-200'
            }`}
          >
            {faCount(missingCount)} بدون نکته
          </button>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            {faCount(reviewedInScope)} بررسی‌شده
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">{scopeLabel}</span>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان، لیست یا نکته…"
              className="min-h-11 w-full rounded-xl border border-[var(--color-border-muted)] bg-white pe-10 ps-3 text-sm"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => {
              const next = e.target.value;
              setCategoryId(next);
              setListId('');
              applyScope(next, '');
            }}
            aria-label="دسته"
            className="min-h-11 rounded-xl border border-[var(--color-border-muted)] bg-white px-3 text-sm lg:w-44"
          >
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon ? `${category.icon} ` : ''}
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={listId}
            onChange={(e) => {
              const next = e.target.value;
              setListId(next);
              applyScope(categoryId, next);
            }}
            aria-label="لیست"
            className="min-h-11 rounded-xl border border-[var(--color-border-muted)] bg-white px-3 text-sm lg:w-56"
          >
            <option value="">همهٔ لیست‌های دسته</option>
            {listsInCategory.map((list) => (
              <option key={list.id} value={list.id}>
                {list.title} ({faCount(list.itemCount)})
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as TipSort)}
            aria-label="مرتب‌سازی"
            className="min-h-11 rounded-xl border border-[var(--color-border-muted)] bg-white px-3 text-sm lg:w-44"
          >
            <option value="list">ترتیب لیست</option>
            <option value="title">عنوان</option>
            <option value="missing">بدون نکته اول</option>
            <option value="shortest">کوتاه‌ترین</option>
            <option value="longest">بلندترین</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReviewed((value) => !value)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium ${
              showReviewed
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-[var(--color-border-muted)] hover:bg-[var(--color-bg)]'
            }`}
          >
            {showReviewed ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            {showReviewed ? 'صف بررسی' : 'بررسی‌شده‌ها'}
          </button>

          {!showReviewed && (
            <>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border-muted)] px-3 text-sm font-medium hover:bg-[var(--color-bg)]"
              >
                {allFilteredSelected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                {allFilteredSelected ? 'لغو انتخاب' : 'انتخاب همه'}
                <span className="text-[var(--color-text-muted)]">({faCount(filteredItems.length)})</span>
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => void markSelectedReviewed()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800"
                >
                  <CheckCircle2 className="size-4" />
                  انجام شد ({faCount(selectedIds.size)})
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => exportItems(exportTarget)}
            disabled={exportTarget.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-800 disabled:opacity-50"
          >
            <Download className="size-4" />
            خروجی JSON
          </button>
          <button
            type="button"
            onClick={() => void copyAiPrompt(exportTarget)}
            disabled={exportTarget.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-900 disabled:opacity-50"
          >
            <ClipboardCopy className="size-4" />
            کپی برای هوش مصنوعی
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800"
          >
            <FileJson className="size-4" />
            ورود JSON
          </button>
        </div>
      </div>

      <ul className="overflow-hidden rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)]">
        {pageRows.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
            {showReviewed
              ? 'آیتم بررسی‌شده‌ای نیست'
              : pendingCount === 0
                ? 'همهٔ آیتم‌ها بررسی شده‌اند'
                : 'آیتمی با این فیلتر پیدا نشد'}
          </li>
        ) : (
          pageRows.map((item) => {
            const editing = editingId === item.id;
            const dirty = isDirty(item);
            const isReviewed = isItemTipReviewed(item, reviewedIds);
            const preview = (item.tip ?? '').trim();

            return (
              <li
                key={item.id}
                className={`border-b border-[var(--color-border-muted)] p-3 last:border-b-0 ${
                  isReviewed ? 'bg-emerald-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {!showReviewed && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="mt-3 size-4 shrink-0 rounded border-gray-300 text-violet-600"
                      aria-label={`انتخاب ${item.title}`}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/items/${item.id}/edit`}
                        className="text-sm font-semibold text-[var(--color-text)] hover:text-[var(--primary)]"
                      >
                        {item.title}
                      </Link>
                      {!listId && (
                        <span className="text-xs text-[var(--color-text-muted)]">{item.listTitle}</span>
                      )}
                    </div>

                    {editing ? (
                      <div className="mt-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows={4}
                          autoFocus
                          placeholder="نکتهٔ کوتاه برای نمایش در اپ…"
                          className="min-h-24 w-full resize-y rounded-xl border border-[var(--color-border-muted)] px-3 py-2 text-sm leading-relaxed focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`text-xs ${
                              tooLong ? 'font-semibold text-red-600' : 'text-[var(--color-text-muted)]'
                            }`}
                          >
                            {faCount(editValue.trim().length)} از {faCount(TIP_MAX)} نویسه
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={closeEditor}
                              className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[var(--color-border-muted)] px-3 text-sm font-medium"
                            >
                              <X className="size-4" />
                              لغو
                            </button>
                            <button
                              type="button"
                              disabled={!dirty || saveState === 'saving' || tooLong}
                              onClick={() => void saveTip(item)}
                              className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white disabled:opacity-40"
                            >
                              {saveState === 'saving' ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Save className="size-4" />
                              )}
                              ذخیره
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={`mt-2 line-clamp-2 text-sm leading-relaxed ${
                          preview ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                        }`}
                      >
                        {preview || 'نکته‌ای نوشته نشده'}
                      </p>
                    )}
                  </div>

                  {!editing && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openEditor(item)}
                        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-800"
                      >
                        <Pencil className="size-4" />
                        ویرایش
                      </button>
                      {!showReviewed ? (
                        <button
                          type="button"
                          onClick={() => void markReviewed(item)}
                          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800"
                        >
                          <CheckCircle2 className="size-4" />
                          انجام شد
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewedIds(unmarkItemTipReviewed(item));
                            setToast({ message: 'به صف بررسی برگشت', type: 'success' });
                          }}
                          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--color-border-muted)] px-3 text-sm font-medium"
                        >
                          <RotateCcw className="size-4" />
                          بازگردانی
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-[var(--color-border-muted)] bg-white disabled:opacity-40"
            aria-label="صفحه قبل"
          >
            <ChevronRight className="size-5" />
          </button>
          <span className="text-sm text-[var(--color-text-muted)]">
            صفحه {faCount(safePage)} از {faCount(pageCount)}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount}
            onClick={() => setPage(safePage + 1)}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-[var(--color-border-muted)] bg-white disabled:opacity-40"
            aria-label="صفحه بعد"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>
      )}

      {importOpen && (
        <ItemTipImportModal
          importing={importing}
          importProgress={importProgress}
          onClose={closeImportModal}
          onImport={handleImport}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={3000} />
      )}
    </div>
  );
}
