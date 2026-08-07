'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CheckSquare,
  ClipboardCopy,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Square,
} from 'lucide-react';
import ItemTipImportModal from '@/components/admin/lists/ItemTipImportModal';
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

type Props = {
  data: ItemTipsPageData;
  embedded?: boolean;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function normalizeSearch(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function ItemTipsClient({ data, embedded = false }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ItemTipRow[]>(data.items);
  const [categoryId, setCategoryId] = useState(data.initialCategoryId);
  const [listId, setListId] = useState(data.initialListId);
  const [search, setSearch] = useState('');
  const [showReviewed, setShowReviewed] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<BulkImportProgress>(INITIAL_BULK_IMPORT_PROGRESS);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    setItems(data.items);
    setCategoryId(data.initialCategoryId);
    setListId(data.initialListId);
    setSelectedIds(new Set());
    setDrafts({});
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

  const listsInCategory = useMemo(() => {
    if (!categoryId) return data.lists;
    return data.lists.filter((list) => list.categoryId === categoryId);
  }, [categoryId, data.lists]);

  const scopeLabel = useMemo(() => {
    if (listId) {
      const list = data.lists.find((row) => row.id === listId);
      return list ? `لیست: ${list.title}` : 'لیست';
    }
    if (categoryId) {
      return data.categories.find((cat) => cat.id === categoryId)?.name ?? 'دسته';
    }
    return 'همه';
  }, [listId, categoryId, data.lists, data.categories]);

  const filteredItems = useMemo(() => {
    const q = normalizeSearch(search);
    return items.filter((item) => {
      const reviewed = isItemTipReviewed(item, reviewedIds);
      if (!showReviewed && reviewed) return false;
      if (showReviewed && !reviewed) return false;
      if (!q) return true;
      return (
        normalizeSearch(item.title).includes(q) ||
        normalizeSearch(item.listTitle).includes(q) ||
        normalizeSearch(item.tip ?? '').includes(q)
      );
    });
  }, [items, search, reviewedIds, showReviewed]);

  const reviewedInScope = useMemo(
    () => items.filter((item) => isItemTipReviewed(item, reviewedIds)).length,
    [items, reviewedIds]
  );

  const pendingCount = items.length - reviewedInScope;

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const getDraft = useCallback(
    (item: ItemTipRow) => (drafts[item.id] !== undefined ? drafts[item.id] : item.tip ?? ''),
    [drafts]
  );

  const isDirty = useCallback(
    (item: ItemTipRow) => {
      if (drafts[item.id] === undefined) return false;
      return (drafts[item.id] ?? '').trim() !== (item.tip ?? '').trim();
    },
    [drafts]
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

  const saveTip = async (item: ItemTipRow, silent = false) => {
    if (!isDirty(item)) return true;
    const nextTip = (drafts[item.id] ?? '').trim() || null;
    setSaveStates((prev) => ({ ...prev, [item.id]: 'saving' }));
    try {
      const res = await fetch(`/api/admin/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip: nextTip }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'خطا در ذخیره');

      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, tip: nextTip } : row))
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setSaveStates((prev) => ({ ...prev, [item.id]: 'saved' }));
      window.setTimeout(() => {
        setSaveStates((prev) => ({ ...prev, [item.id]: 'idle' }));
      }, 1500);
      return true;
    } catch (error) {
      setSaveStates((prev) => ({ ...prev, [item.id]: 'error' }));
      if (!silent) {
        setToast({
          message: error instanceof Error ? error.message : 'خطا در ذخیره tip',
          type: 'error',
        });
      }
      return false;
    }
  };

  const markReviewed = async (item: ItemTipRow) => {
    if (isDirty(item)) {
      const saved = await saveTip(item, true);
      if (!saved) {
        setToast({ message: 'ابتدا tip را ذخیره کنید', type: 'error' });
        return;
      }
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
    for (const item of targets) {
      if (isDirty(item)) {
        const saved = await saveTip(item, true);
        if (!saved) {
          setToast({ message: `ذخیره «${item.title}» ناموفق بود`, type: 'error' });
          return;
        }
      }
    }
    setReviewedIds(markManyItemTipsReviewed(targets));
    setSelectedIds(new Set());
    setToast({
      message: `${targets.length.toLocaleString('fa-IR')} آیتم از صف خارج شد`,
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
    setToast({ message: 'پرامپت + JSON برای هوش مصنوعی کپی شد', type: 'success' });
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
      setDrafts({});
      setToast({
        message: `${result.updated.toLocaleString('fa-IR')} tip به‌روز شد · ${result.skipped.toLocaleString('fa-IR')} بدون تغییر${
          result.failed > 0 ? ` · ${result.failed.toLocaleString('fa-IR')} خطا` : ''
        }`,
        type: result.failed > 0 ? 'error' : 'success',
      });
      router.refresh();
    } catch (error) {
      setImportProgress(INITIAL_BULK_IMPORT_PROGRESS);
      setToast({
        message: error instanceof Error ? error.message : 'خطا در import',
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

  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">نکته‌های آیتم (tip)</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            ویرایش tip · export برای AI · علامت‌گذاری بررسی‌شده
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-900 ring-1 ring-amber-200">
            {pendingCount.toLocaleString('fa-IR')} نیاز به بررسی
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200">
            {reviewedInScope.toLocaleString('fa-IR')} بررسی‌شده
          </span>
          <span className="text-[var(--color-text-muted)]">· {scopeLabel}</span>
          {!listId && categoryId && (
            <span className="text-[var(--color-text-muted)]">
              · {items.length.toLocaleString('fa-IR')} آیتم یکتا
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان، لیست یا tip..."
              className="w-full rounded-xl border border-[var(--color-border-muted)] py-2.5 pr-10 pl-3 text-sm"
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
            className="rounded-xl border border-[var(--color-border-muted)] px-3 py-2.5 text-sm min-w-[160px]"
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
            className="rounded-xl border border-[var(--color-border-muted)] px-3 py-2.5 text-sm min-w-[180px]"
          >
            <option value="">همه لیست‌های دسته</option>
            {listsInCategory.map((list) => (
              <option key={list.id} value={list.id}>
                {list.title} ({list.itemCount.toLocaleString('fa-IR')})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReviewed((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium ${
              showReviewed
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-[var(--color-border-muted)] hover:bg-[var(--color-bg)]'
            }`}
          >
            {showReviewed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showReviewed ? 'صف بررسی' : 'بررسی‌شده‌ها'}
          </button>

          {!showReviewed && (
            <>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-[var(--color-bg)]"
              >
                {allFilteredSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                انتخاب همه ({filteredItems.length.toLocaleString('fa-IR')})
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => void markSelectedReviewed()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  انجام شد ({selectedIds.size.toLocaleString('fa-IR')})
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => exportItems(exportTarget)}
            disabled={exportTarget.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            خروجی JSON
          </button>
          <button
            type="button"
            onClick={() => void copyAiPrompt(exportTarget)}
            disabled={exportTarget.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 disabled:opacity-50"
          >
            <ClipboardCopy className="h-4 w-4" />
            کپی برای AI
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
          >
            <FileJson className="h-4 w-4" />
            ورود JSON
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)]">
        <div className="overflow-auto max-h-[calc(100vh-18rem)]">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-10" />
              <col className="w-[148px]" />
              <col />
              <col className="w-[96px]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-[var(--color-bg)]/95 text-[var(--color-text-muted)] backdrop-blur-sm">
              <tr>
                <th className="px-3 py-3" />
                <th className="px-2 py-2.5 text-right font-medium">آیتم</th>
                <th className="px-2.5 py-2.5 text-right font-medium">tip</th>
                <th className="px-1.5 py-2.5 text-center font-medium w-[96px]">
                  <span className="sr-only">عملیات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-muted)]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[var(--color-text-muted)]">
                    {showReviewed
                      ? 'آیتم بررسی‌شده‌ای نیست'
                      : pendingCount === 0
                        ? 'همه آیتم‌ها بررسی شده‌اند'
                        : 'آیتمی با این فیلتر پیدا نشد'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const dirty = isDirty(item);
                  const saveState = saveStates[item.id] ?? 'idle';
                  const isReviewed = isItemTipReviewed(item, reviewedIds);
                  return (
                    <tr key={item.id} className={`align-top hover:bg-[var(--color-bg)]/30 ${isReviewed ? 'bg-emerald-50/40' : ''}`}>
                      <td className="px-3 py-3">
                        {!showReviewed && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="h-4 w-4 rounded border-gray-300 text-violet-600"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="min-w-0">
                          <Link
                            href={`/admin/items/${item.id}/edit`}
                            className="block text-[11px] font-semibold leading-snug text-[var(--color-text)] hover:text-[var(--primary)] line-clamp-4"
                            title={item.title}
                          >
                            {item.title}
                          </Link>
                          {!listId && (
                            <p
                              className="mt-1 text-[9px] text-[var(--color-text-muted)] line-clamp-1"
                              title={item.listTitle}
                            >
                              {item.listTitle}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <textarea
                          value={getDraft(item)}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          onBlur={() => {
                            if (dirty) void saveTip(item);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              void saveTip(item);
                            }
                          }}
                          rows={4}
                          maxLength={500}
                          placeholder="نکتهٔ کوتاه برای نمایش در اپ..."
                          disabled={showReviewed}
                          className={`w-full rounded-xl border px-3 py-2 text-sm leading-relaxed resize-y min-h-[104px] disabled:bg-[var(--color-bg)]/50 ${
                            !getDraft(item).trim() && !showReviewed
                              ? 'border-amber-200 bg-amber-50/30'
                              : 'border-[var(--color-border-muted)]'
                          }`}
                        />
                        <p className="mt-1 text-[9px] text-[var(--color-text-muted)] tabular-nums text-left" dir="ltr">
                          {getDraft(item).length}/500
                        </p>
                      </td>
                      <td className="px-1.5 py-2.5">
                        <div className="flex flex-col items-center gap-1">
                          {!showReviewed ? (
                            <>
                              <button
                                type="button"
                                disabled={!dirty || saveState === 'saving'}
                                onClick={() => void saveTip(item)}
                                title="ذخیره"
                                aria-label="ذخیره tip"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border-muted)] hover:bg-[var(--color-bg)] disabled:opacity-40"
                              >
                                {saveState === 'saving' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => void markReviewed(item)}
                                title="انجام شد — از صف خارج"
                                aria-label="انجام شد"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewedIds(unmarkItemTipReviewed(item));
                                setToast({ message: 'به صف بررسی برگشت', type: 'success' });
                              }}
                              title="بازگردانی به صف"
                              aria-label="بازگردانی"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-[var(--color-bg)]"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
