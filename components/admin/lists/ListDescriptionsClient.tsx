'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import ListDescriptionImportModal from '@/components/admin/lists/ListDescriptionImportModal';
import Toast, { type ToastType } from '@/components/shared/Toast';
import {
  buildExternalListDescriptionAiPrompt,
  buildListDescriptionExportPayload,
  type ListDescriptionRow,
  type ListDescriptionsPageData,
} from '@/lib/admin/list-description-import';
import {
  getReviewedListDescriptionIds,
  markListDescriptionReviewed,
  markManyListDescriptionsReviewed,
  unmarkListDescriptionReviewed,
} from '@/lib/admin/list-description-review-storage';
import {
  INITIAL_BULK_IMPORT_PROGRESS,
  runBatchedJsonImport,
  type BulkImportProgress,
} from '@/lib/admin/bulk-json-import-client';

type Props = {
  data: ListDescriptionsPageData;
  embedded?: boolean;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function normalizeSearch(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function ListDescriptionsClient({ data, embedded = false }: Props) {
  const router = useRouter();
  const [lists, setLists] = useState<ListDescriptionRow[]>(data.lists);
  const [categoryId, setCategoryId] = useState('all');
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
    setReviewedIds(getReviewedListDescriptionIds());
  }, []);

  const categoryLabel = useMemo(() => {
    if (categoryId === 'all') return 'همه دسته‌ها';
    return data.categories.find((category) => category.id === categoryId)?.name ?? 'دسته';
  }, [categoryId, data.categories]);

  const filteredLists = useMemo(() => {
    const q = normalizeSearch(search);
    return lists.filter((list) => {
      if (categoryId !== 'all' && list.categoryId !== categoryId) return false;
      const reviewed = reviewedIds.has(list.id);
      if (!showReviewed && reviewed) return false;
      if (showReviewed && !reviewed) return false;
      if (!q) return true;
      return (
        normalizeSearch(list.title).includes(q) ||
        normalizeSearch(list.slug).includes(q) ||
        normalizeSearch(list.description ?? '').includes(q)
      );
    });
  }, [lists, categoryId, search, reviewedIds, showReviewed]);

  const pendingCount = useMemo(
    () =>
      lists.filter((list) => {
        if (categoryId !== 'all' && list.categoryId !== categoryId) return false;
        return !reviewedIds.has(list.id);
      }).length,
    [lists, categoryId, reviewedIds]
  );

  const reviewedCount = reviewedIds.size;

  const allFilteredSelected =
    filteredLists.length > 0 && filteredLists.every((list) => selectedIds.has(list.id));

  const selectedLists = useMemo(
    () => lists.filter((list) => selectedIds.has(list.id)),
    [lists, selectedIds]
  );

  const getDraft = useCallback(
    (list: ListDescriptionRow) =>
      drafts[list.id] !== undefined ? drafts[list.id] : list.description ?? '',
    [drafts]
  );

  const isDirty = useCallback(
    (list: ListDescriptionRow) => {
      if (drafts[list.id] === undefined) return false;
      return (drafts[list.id] ?? '').trim() !== (list.description ?? '').trim();
    },
    [drafts]
  );

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredLists.forEach((list) => next.delete(list.id));
        return next;
      });
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredLists.forEach((list) => next.add(list.id));
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

  const saveDescription = async (list: ListDescriptionRow, silent = false) => {
    if (!isDirty(list)) return true;
    const nextDescription = (drafts[list.id] ?? '').trim() || null;
    setSaveStates((prev) => ({ ...prev, [list.id]: 'saving' }));
    try {
      const res = await fetch(`/api/admin/lists/${list.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: nextDescription }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'خطا در ذخیره');

      setLists((prev) =>
        prev.map((row) => (row.id === list.id ? { ...row, description: nextDescription } : row))
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[list.id];
        return next;
      });
      setSaveStates((prev) => ({ ...prev, [list.id]: 'saved' }));
      window.setTimeout(() => {
        setSaveStates((prev) => ({ ...prev, [list.id]: 'idle' }));
      }, 1500);
      return true;
    } catch (error) {
      setSaveStates((prev) => ({ ...prev, [list.id]: 'error' }));
      if (!silent) {
        setToast({
          message: error instanceof Error ? error.message : 'خطا در ذخیره توضیحات',
          type: 'error',
        });
      }
      return false;
    }
  };

  const markReviewed = async (list: ListDescriptionRow) => {
    if (isDirty(list)) {
      const saved = await saveDescription(list, true);
      if (!saved) {
        setToast({ message: 'ابتدا توضیحات را ذخیره کنید', type: 'error' });
        return;
      }
    }
    setReviewedIds(markListDescriptionReviewed(list.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(list.id);
      return next;
    });
    setToast({ message: 'از صف بررسی خارج شد', type: 'success' });
  };

  const markSelectedReviewed = async () => {
    const targets = lists.filter((list) => selectedIds.has(list.id) && !reviewedIds.has(list.id));
    if (targets.length === 0) return;

    for (const list of targets) {
      if (isDirty(list)) {
        const saved = await saveDescription(list, true);
        if (!saved) {
          setToast({ message: `ذخیره «${list.title}» ناموفق بود`, type: 'error' });
          return;
        }
      }
    }

    setReviewedIds(markManyListDescriptionsReviewed(targets.map((list) => list.id)));
    setSelectedIds(new Set());
    setToast({
      message: `${targets.length.toLocaleString('fa-IR')} لیست از صف خارج شد`,
      type: 'success',
    });
  };

  const restoreReviewed = (listId: string) => {
    setReviewedIds(unmarkListDescriptionReviewed(listId));
    setToast({ message: 'به صف بررسی برگشت', type: 'success' });
  };

  const exportLists = (rows: ListDescriptionRow[]) => {
    const payload = buildListDescriptionExportPayload(rows);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `list-descriptions-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyAiPrompt = async (rows: ListDescriptionRow[]) => {
    const payload = buildListDescriptionExportPayload(rows);
    const prompt = buildExternalListDescriptionAiPrompt(payload.lists);
    await navigator.clipboard.writeText(prompt);
    setToast({ message: 'پرامپت + JSON برای هوش مصنوعی کپی شد', type: 'success' });
  };

  const handleImport = async (payload: {
    lists: { id?: string; slug?: string; description: string | null }[];
  }) => {
    setImporting(true);
    setImportProgress({ ...INITIAL_BULK_IMPORT_PROGRESS, total: payload.lists.length });
    try {
      const result = await runBatchedJsonImport({
        items: payload.lists,
        endpoint: '/api/admin/lists/import-descriptions',
        buildBody: (batch) => ({ lists: batch }),
        onProgress: setImportProgress,
      });

      const byId = new Map(payload.lists.filter((item) => item.id).map((item) => [item.id!, item]));
      const bySlug = new Map(payload.lists.filter((item) => item.slug).map((item) => [item.slug!, item]));

      setLists((prev) =>
        prev.map((list) => {
          const imported = byId.get(list.id) || (list.slug ? bySlug.get(list.slug) : undefined);
          if (!imported) return list;
          return { ...list, description: imported.description?.trim() || null };
        })
      );
      setDrafts({});
      setToast({
        message: `${result.updated.toLocaleString('fa-IR')} توضیح به‌روز شد · ${result.skipped.toLocaleString('fa-IR')} بدون تغییر${
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

  const exportTarget = selectedLists.length > 0 ? selectedLists : filteredLists;

  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">توضیحات لیست‌ها</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            ویرایش inline · export برای AI · علامت‌گذاری بررسی‌شده
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-900 ring-1 ring-amber-200">
            {pendingCount.toLocaleString('fa-IR')} نیاز به بررسی
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200">
            {reviewedCount.toLocaleString('fa-IR')} بررسی‌شده
          </span>
          <span className="text-[var(--color-text-muted)]">· {categoryLabel}</span>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان، slug یا توضیحات..."
              className="w-full rounded-xl border border-[var(--color-border-muted)] py-2.5 pr-10 pl-3 text-sm"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-xl border border-[var(--color-border-muted)] px-3 py-2.5 text-sm min-w-[180px]"
          >
            <option value="all">همه دسته‌ها</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon ? `${category.icon} ` : ''}
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReviewed((value) => !value)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border-muted)] px-3 py-2 text-xs font-medium hover:bg-[var(--color-bg)]"
              >
                {allFilteredSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {allFilteredSelected ? 'لغو انتخاب' : 'انتخاب همه'}
                <span className="text-[var(--color-text-muted)]">
                  ({filteredLists.length.toLocaleString('fa-IR')})
                </span>
              </button>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => void markSelectedReviewed()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  انجام شد ({selectedIds.size.toLocaleString('fa-IR')})
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => exportLists(exportTarget)}
            disabled={exportTarget.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            خروجی JSON
            {selectedLists.length > 0 && (
              <span>({selectedLists.length.toLocaleString('fa-IR')})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => void copyAiPrompt(exportTarget)}
            disabled={exportTarget.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-50"
          >
            <ClipboardCopy className="h-4 w-4" />
            کپی برای AI
          </button>

          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            <FileJson className="h-4 w-4" />
            ورود JSON
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-10" />
              <col className="w-[148px]" />
              <col />
              <col className="w-[132px]" />
            </colgroup>
            <thead className="bg-[var(--color-bg)]/60 text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-3 text-right font-medium" />
                <th className="px-3 py-3 text-right font-medium">لیست</th>
                <th className="px-3 py-3 text-right font-medium">توضیحات</th>
                <th className="px-3 py-3 text-right font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-muted)]">
              {filteredLists.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[var(--color-text-muted)]">
                    {showReviewed
                      ? 'لیست بررسی‌شده‌ای نیست'
                      : pendingCount === 0
                        ? 'همه لیست‌ها بررسی شده‌اند 🎉'
                        : 'لیستی با این فیلتر پیدا نشد'}
                  </td>
                </tr>
              ) : (
                filteredLists.map((list) => {
                  const dirty = isDirty(list);
                  const saveState = saveStates[list.id] ?? 'idle';
                  const isReviewed = reviewedIds.has(list.id);

                  return (
                    <tr
                      key={list.id}
                      className={`align-top hover:bg-[var(--color-bg)]/30 ${
                        isReviewed ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="px-3 py-3">
                        {!showReviewed && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(list.id)}
                            onChange={() => toggleSelect(list.id)}
                            className="h-4 w-4 rounded border-gray-300 text-violet-600"
                          />
                        )}
                      </td>
                      <td className="px-2.5 py-3">
                        <div className="min-w-0">
                          <Link
                            href={`/admin/lists/${list.id}`}
                            className="block text-xs font-semibold leading-snug text-[var(--color-text)] hover:text-[var(--primary)] line-clamp-3"
                          >
                            {list.title}
                          </Link>
                          <p className="mt-1 text-[10px] text-[var(--color-text-muted)] tabular-nums">
                            {list.itemCount.toLocaleString('fa-IR')} آیتم
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <textarea
                          value={getDraft(list)}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [list.id]: e.target.value }))
                          }
                          onBlur={() => {
                            if (dirty) void saveDescription(list);
                          }}
                          rows={4}
                          placeholder="توضیحات لیست برای نمایش در اپ..."
                          disabled={showReviewed}
                          className="w-full rounded-xl border border-[var(--color-border-muted)] px-3 py-2.5 text-sm leading-relaxed resize-y min-h-[112px] disabled:bg-[var(--color-bg)]/50 disabled:text-[var(--color-text-muted)]"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1.5">
                          {!showReviewed ? (
                            <>
                              <button
                                type="button"
                                disabled={!dirty || saveState === 'saving'}
                                onClick={() => void saveDescription(list)}
                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border-muted)] px-2 py-1.5 text-[11px] font-medium hover:bg-[var(--color-bg)] disabled:opacity-40"
                              >
                                {saveState === 'saving' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                {saveState === 'saved' ? 'ذخیره شد' : 'ذخیره'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void markReviewed(list)}
                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                                title="اصلاح شد یا نیازی به اصلاح ندارد"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                انجام شد
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => restoreReviewed(list.id)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border-muted)] px-2 py-1.5 text-[11px] font-medium hover:bg-[var(--color-bg)]"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              بازگردانی
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
        <ListDescriptionImportModal
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
