'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

const ListDescriptionImportModal = dynamic(
  () => import('@/components/admin/lists/ListDescriptionImportModal')
);

const PAGE_SIZE = 12;
const DESCRIPTION_MAX = 2000;

type Props = {
  data: ListDescriptionsPageData;
  embedded?: boolean;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function normalizeSearch(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function faCount(value: number): string {
  return value.toLocaleString('fa-IR');
}

export default function ListDescriptionsClient({ data, embedded = false }: Props) {
  const router = useRouter();
  const [lists, setLists] = useState<ListDescriptionRow[]>(data.lists);
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [showReviewed, setShowReviewed] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);
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
    setReviewedIds(getReviewedListDescriptionIds());
  }, []);

  useEffect(() => {
    setPage(1);
  }, [categoryId, search, showReviewed, missingOnly]);

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
      if (missingOnly && (list.description ?? '').trim()) return false;
      if (!q) return true;
      return (
        normalizeSearch(list.title).includes(q) ||
        normalizeSearch(list.slug).includes(q) ||
        normalizeSearch(list.description ?? '').includes(q)
      );
    });
  }, [lists, categoryId, search, reviewedIds, showReviewed, missingOnly]);

  const pendingCount = useMemo(
    () =>
      lists.filter((list) => {
        if (categoryId !== 'all' && list.categoryId !== categoryId) return false;
        return !reviewedIds.has(list.id);
      }).length,
    [lists, categoryId, reviewedIds]
  );

  const missingCount = useMemo(
    () =>
      lists.filter((list) => {
        if (categoryId !== 'all' && list.categoryId !== categoryId) return false;
        if (reviewedIds.has(list.id)) return false;
        return !(list.description ?? '').trim();
      }).length,
    [lists, categoryId, reviewedIds]
  );

  const pageCount = Math.max(1, Math.ceil(filteredLists.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredLists.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allFilteredSelected =
    filteredLists.length > 0 && filteredLists.every((list) => selectedIds.has(list.id));

  const selectedLists = useMemo(
    () => lists.filter((list) => selectedIds.has(list.id)),
    [lists, selectedIds]
  );

  const isDirty = useCallback(
    (list: ListDescriptionRow) =>
      editingId === list.id && editValue.trim() !== (list.description ?? '').trim(),
    [editingId, editValue]
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

  const closeEditor = () => {
    setEditingId(null);
    setEditValue('');
    setSaveState('idle');
  };

  const openEditor = (list: ListDescriptionRow) => {
    if (editingId && editingId !== list.id) {
      const current = lists.find((row) => row.id === editingId);
      if (current && editValue.trim() !== (current.description ?? '').trim()) {
        setToast({ message: 'اول توضیح باز را ذخیره یا لغو کنید', type: 'error' });
        return;
      }
    }
    setEditingId(list.id);
    setEditValue(list.description ?? '');
    setSaveState('idle');
  };

  const saveDescription = async (list: ListDescriptionRow, silent = false) => {
    const nextDescription = editValue.trim() || null;
    if (nextDescription && nextDescription.length > DESCRIPTION_MAX) {
      setToast({
        message: 'توضیحات نباید بیشتر از ۲٬۰۰۰ نویسه باشد',
        type: 'error',
      });
      return false;
    }
    if ((list.description ?? null) === nextDescription) {
      closeEditor();
      return true;
    }

    setSaveState('saving');
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
      setSaveState('saved');
      closeEditor();
      if (!silent) setToast({ message: 'توضیحات ذخیره شد', type: 'success' });
      return true;
    } catch (error) {
      setSaveState('error');
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
    if (editingId === list.id && isDirty(list)) {
      const saved = await saveDescription(list, true);
      if (!saved) {
        setToast({ message: 'ابتدا توضیحات را ذخیره کنید', type: 'error' });
        return;
      }
    } else if (editingId === list.id) {
      closeEditor();
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

    const open = targets.find((list) => list.id === editingId);
    if (open && isDirty(open)) {
      const saved = await saveDescription(open, true);
      if (!saved) {
        setToast({ message: `ذخیره «${open.title}» ناموفق بود`, type: 'error' });
        return;
      }
    }

    setReviewedIds(markManyListDescriptionsReviewed(targets.map((list) => list.id)));
    setSelectedIds(new Set());
    if (editingId && targets.some((list) => list.id === editingId)) closeEditor();
    setToast({
      message: `${faCount(targets.length)} لیست از صف خارج شد`,
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
    setToast({ message: 'پرامپت و JSON برای هوش مصنوعی کپی شد', type: 'success' });
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
      const bySlug = new Map(
        payload.lists.filter((item) => item.slug).map((item) => [item.slug!, item])
      );

      setLists((prev) =>
        prev.map((list) => {
          const imported = byId.get(list.id) || (list.slug ? bySlug.get(list.slug) : undefined);
          if (!imported) return list;
          return { ...list, description: imported.description?.trim() || null };
        })
      );
      closeEditor();
      setToast({
        message: `${faCount(result.updated)} توضیح به‌روز شد · ${faCount(result.skipped)} بدون تغییر${
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

  const exportTarget = selectedLists.length > 0 ? selectedLists : filteredLists;
  const tooLong = editValue.trim().length > DESCRIPTION_MAX;

  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">توضیحات لیست‌ها</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            هر لیست یک توضیح دارد. برای تغییر، ویرایش را بزنید.
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
            {faCount(missingCount)} بدون توضیحات
          </button>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            {faCount(reviewedIds.size)} بررسی‌شده
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">{categoryLabel}</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان یا توضیحات…"
              className="min-h-11 w-full rounded-xl border border-[var(--color-border-muted)] bg-white pe-10 ps-3 text-sm"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="دسته"
            className="min-h-11 rounded-xl border border-[var(--color-border-muted)] bg-white px-3 text-sm sm:w-52"
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
                <span className="text-[var(--color-text-muted)]">({faCount(filteredLists.length)})</span>
              </button>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => void markSelectedReviewed()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <CheckCircle2 className="size-4" />
                  انجام شد ({faCount(selectedIds.size)})
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => exportLists(exportTarget)}
            disabled={exportTarget.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
          >
            <Download className="size-4" />
            خروجی JSON
            {selectedLists.length > 0 && <span>({faCount(selectedLists.length)})</span>}
          </button>

          <button
            type="button"
            onClick={() => void copyAiPrompt(exportTarget)}
            disabled={exportTarget.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-50"
          >
            <ClipboardCopy className="size-4" />
            کپی برای هوش مصنوعی
          </button>

          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
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
              ? 'لیست بررسی‌شده‌ای نیست'
              : pendingCount === 0
                ? 'همهٔ لیست‌ها بررسی شده‌اند'
                : 'لیستی با این فیلتر پیدا نشد'}
          </li>
        ) : (
          pageRows.map((list) => {
            const editing = editingId === list.id;
            const dirty = isDirty(list);
            const isReviewed = reviewedIds.has(list.id);
            const preview = (list.description ?? '').trim();

            return (
              <li
                key={list.id}
                className={`border-b border-[var(--color-border-muted)] p-3 last:border-b-0 ${
                  isReviewed ? 'bg-emerald-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {!showReviewed && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(list.id)}
                      onChange={() => toggleSelect(list.id)}
                      className="mt-3 size-4 shrink-0 rounded border-gray-300 text-violet-600"
                      aria-label={`انتخاب ${list.title}`}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/lists/${list.id}`}
                        className="text-sm font-semibold text-[var(--color-text)] hover:text-[var(--primary)]"
                      >
                        {list.title}
                      </Link>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {list.categoryIcon} {list.categoryName}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {faCount(list.itemCount)} آیتم
                      </span>
                    </div>

                    {editing ? (
                      <div className="mt-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows={5}
                          autoFocus
                          placeholder="توضیحات لیست برای نمایش در اپ…"
                          className="min-h-28 w-full resize-y rounded-xl border border-[var(--color-border-muted)] px-3 py-2 text-sm leading-relaxed focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-xs ${tooLong ? 'font-semibold text-red-600' : 'text-[var(--color-text-muted)]'}`}>
                            {faCount(editValue.trim().length)} از {faCount(DESCRIPTION_MAX)} نویسه
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
                              disabled={(!dirty && saveState !== 'saving') || saveState === 'saving' || tooLong}
                              onClick={() => void saveDescription(list)}
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
                        {preview || 'توضیحی نوشته نشده'}
                      </p>
                    )}
                  </div>

                  {!editing && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openEditor(list)}
                        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-800"
                      >
                        <Pencil className="size-4" />
                        ویرایش
                      </button>
                      {!showReviewed ? (
                        <button
                          type="button"
                          onClick={() => void markReviewed(list)}
                          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800"
                        >
                          <CheckCircle2 className="size-4" />
                          انجام شد
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => restoreReviewed(list.id)}
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
