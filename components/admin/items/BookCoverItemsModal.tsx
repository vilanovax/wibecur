'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Search,
  BookOpen,
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  ImageOff,
  Upload,
  Sparkles,
  CheckSquare,
  Square,
  Pencil,
  EyeOff,
  Eye,
  Check,
} from 'lucide-react';
import {
  BOOK_COVER_SOURCE_LABELS,
  type BookCoverSearchSource,
} from '@/lib/book-cover-search';
import { toAdminStorageImageSrc } from '@/lib/liara-image-url';

type BookCoverItem = {
  id: string;
  title: string;
  order: number;
  listId: string;
  listTitle: string;
  imageUrl: string;
  status: 'missing' | 'external';
  detectedSource: BookCoverSearchSource | null;
  catalogItemId: string | null;
  isHidden: boolean;
};

type ItemActionPhase = 'idle' | 'fetching' | 'migrating' | 'done' | 'error';

type ItemActionState = {
  phase: ItemActionPhase;
  newUrl?: string;
  error?: string;
  matchedTitle?: string;
};

type BookCoverItemsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  scopeTitle: string;
  listId?: string;
  categoryId?: string;
  onUpdated?: () => void;
};

const SOURCES: BookCoverSearchSource[] = ['fidibo', 'ketabrah', 'taaghche'];

function ActionStatusBadge({ state }: { state: ItemActionState | undefined }) {
  if (!state || state.phase === 'idle') return null;

  if (state.phase === 'fetching') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        در حال استخراج…
      </span>
    );
  }

  if (state.phase === 'migrating') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
        <Loader2 className="h-3 w-3 animate-spin" />
        در حال تبدیل…
      </span>
    );
  }

  if (state.phase === 'done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        ParsPack ✓
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
      title={state.error}
    >
      <AlertCircle className="h-3 w-3" />
      خطا
    </span>
  );
}

export default function BookCoverItemsModal({
  isOpen,
  onClose,
  scopeTitle,
  listId,
  categoryId,
  onUpdated,
}: BookCoverItemsModalProps) {
  const [items, setItems] = useState<BookCoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<BookCoverSearchSource>('fidibo');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionMap, setActionMap] = useState<Record<string, ItemActionState>>({});
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchSummary, setBatchSummary] = useState<{
    success: number;
    failed: number;
    done: boolean;
  } | null>(null);
  const [storageReady, setStorageReady] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [savingTitleId, setSavingTitleId] = useState<string | null>(null);
  const [togglingHideIds, setTogglingHideIds] = useState<Set<string>>(new Set());
  const abortRef = useRef(false);

  const fetchUrl = useMemo(() => {
    if (listId) {
      return `/api/admin/items/book-cover-items?listId=${encodeURIComponent(listId)}`;
    }
    if (categoryId) {
      return `/api/admin/items/book-cover-items?categoryId=${encodeURIComponent(categoryId)}`;
    }
    return null;
  }, [listId, categoryId]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.listTitle.toLowerCase().includes(q)
    );
  }, [items, query]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const selectedExternal = useMemo(
    () => selectedItems.filter((item) => item.status === 'external'),
    [selectedItems]
  );

  const selectedMissing = useMemo(
    () => selectedItems.filter((item) => item.status === 'missing'),
    [selectedItems]
  );

  const allExternalCount = useMemo(
    () => items.filter((item) => item.status === 'external').length,
    [items]
  );

  const allMissingCount = useMemo(
    () => items.filter((item) => item.status === 'missing').length,
    [items]
  );

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const batchProgress = useMemo(() => {
    const total = items.length;
    if (total === 0) return { done: 0, failed: 0, total: 0, percent: 0 };
    const done = Object.values(actionMap).filter((s) => s.phase === 'done').length;
    const failed = Object.values(actionMap).filter((s) => s.phase === 'error').length;
    return {
      done,
      failed,
      total,
      percent: Math.round(((done + failed) / total) * 100),
    };
  }, [items.length, actionMap]);

  const isBusy = isBatchRunning || savingTitleId !== null;

  const resetBatchState = useCallback(() => {
    setActionMap({});
    setIsBatchRunning(false);
    setBatchSummary(null);
    abortRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    if (isBusy) {
      const ok = window.confirm('عملیات در حال انجام است. مطمئنید می‌خواهید ببندید؟');
      if (!ok) return;
      abortRef.current = true;
    }
    setQuery('');
    setSelectedIds(new Set());
    setEditingId(null);
    resetBatchState();
    onClose();
  }, [isBusy, onClose, resetBatchState]);

  const removeItemAfterSuccess = useCallback((itemId: string) => {
    window.setTimeout(() => {
      setItems((prev) => prev.filter((row) => row.id !== itemId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      setActionMap((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }, 900);
  }, []);

  const migrateOne = useCallback(
    async (item: BookCoverItem): Promise<{ success: boolean; stopBatch?: boolean }> => {
      setActionMap((prev) => ({
        ...prev,
        [item.id]: { phase: 'migrating' },
      }));

      try {
        const res = await fetch(`/api/admin/items/${item.id}/migrate-image`, {
          method: 'POST',
        });
        const data = await res.json();

        if (!res.ok) {
          const message = (data.error as string) || 'خطا در تبدیل';
          const stopBatch =
            res.status === 503 || data.errorCode === 'storage_not_configured';

          if (stopBatch) {
            setStorageReady(false);
            setStorageError(message);
          }

          setActionMap((prev) => ({
            ...prev,
            [item.id]: { phase: 'error', error: message },
          }));

          return { success: false, stopBatch };
        }

        const newUrl = (data.newUrl as string) || item.imageUrl;

        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'done', newUrl },
        }));

        removeItemAfterSuccess(item.id);

        const success =
          data.status === 'migrated' ||
          data.status === 'already_on_storage' ||
          data.status === 'already_liara';
        return { success };
      } catch (err: unknown) {
        const message = (err as Error).message || 'خطا در تبدیل';
        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'error', error: message },
        }));
        return { success: false };
      }
    },
    [removeItemAfterSuccess]
  );

  const fetchOne = useCallback(
    async (item: BookCoverItem): Promise<{ success: boolean; stopBatch?: boolean }> => {
      setActionMap((prev) => ({
        ...prev,
        [item.id]: { phase: 'fetching' },
      }));

      try {
        const res = await fetch(`/api/admin/items/${item.id}/fetch-book-cover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source }),
        });
        const data = await res.json();

        if (!res.ok) {
          const message = (data.error as string) || 'خطا در استخراج';
          const stopBatch =
            res.status === 503 || data.errorCode === 'storage_not_configured';

          if (stopBatch) {
            setStorageReady(false);
            setStorageError(message);
          }

          setActionMap((prev) => ({
            ...prev,
            [item.id]: { phase: 'error', error: message },
          }));

          return { success: false, stopBatch };
        }

        const newUrl = (data.newUrl as string) || '';

        setActionMap((prev) => ({
          ...prev,
          [item.id]: {
            phase: 'done',
            newUrl,
            matchedTitle: data.matchedTitle as string | undefined,
          },
        }));

        removeItemAfterSuccess(item.id);

        const success = data.status === 'fetched' || data.status === 'already_on_storage';
        return { success };
      } catch (err: unknown) {
        const message = (err as Error).message || 'خطا در استخراج';
        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'error', error: message },
        }));
        return { success: false };
      }
    },
    [source, removeItemAfterSuccess]
  );

  const runBatch = useCallback(
    async (
      queue: BookCoverItem[],
      mode: 'migrate' | 'fetch'
    ): Promise<{ success: number; failed: number; hadWork: boolean }> => {
      let success = 0;
      let failed = 0;
      let hadWork = false;

      for (const item of queue) {
        if (abortRef.current) break;

        const result =
          mode === 'migrate' ? await migrateOne(item) : await fetchOne(item);

        if (result.success) {
          success++;
          hadWork = true;
        } else {
          failed++;
          if (result.stopBatch) {
            abortRef.current = true;
            break;
          }
        }

        if (!abortRef.current) {
          await new Promise((r) => window.setTimeout(r, 400));
        }
      }

      return { success, failed, hadWork };
    },
    [migrateOne, fetchOne]
  );

  const handleMigrateSelected = useCallback(async () => {
    const queue = selectedExternal;
    if (queue.length === 0 || isBatchRunning || !storageReady) return;

    const ok = window.confirm(
      `${queue.length.toLocaleString('fa-IR')} تصویر موجود دانلود و روی ParsPack آپلود می‌شود.\n\nادامه؟`
    );
    if (!ok) return;

    abortRef.current = false;
    setIsBatchRunning(true);
    setBatchSummary(null);

    const { success, failed, hadWork } = await runBatch(queue, 'migrate');

    setIsBatchRunning(false);
    setBatchSummary({ success, failed, done: true });
    if (hadWork) onUpdated?.();
  }, [selectedExternal, isBatchRunning, storageReady, runBatch, onUpdated]);

  const handleMigrateAllExternal = useCallback(async () => {
    const queue = items.filter((item) => item.status === 'external');
    if (queue.length === 0 || isBatchRunning || !storageReady) return;

    const ok = window.confirm(
      `${queue.length.toLocaleString('fa-IR')} تصویر خارجی به ParsPack منتقل می‌شود.\n\nادامه؟`
    );
    if (!ok) return;

    abortRef.current = false;
    setIsBatchRunning(true);
    setBatchSummary(null);

    const { success, failed, hadWork } = await runBatch(queue, 'migrate');

    setIsBatchRunning(false);
    setBatchSummary({ success, failed, done: true });
    if (hadWork) onUpdated?.();
  }, [items, isBatchRunning, storageReady, runBatch, onUpdated]);

  const handleExtractSelected = useCallback(async () => {
    const queue = selectedMissing;
    if (queue.length === 0 || isBatchRunning || !storageReady) return;

    const label = BOOK_COVER_SOURCE_LABELS[source];
    const ok = window.confirm(
      `کاور ${queue.length.toLocaleString('fa-IR')} کتاب از ${label} استخراج می‌شود.\n\nادامه؟`
    );
    if (!ok) return;

    abortRef.current = false;
    setIsBatchRunning(true);
    setBatchSummary(null);

    const { success, failed, hadWork } = await runBatch(queue, 'fetch');

    setIsBatchRunning(false);
    setBatchSummary({ success, failed, done: true });
    if (hadWork) onUpdated?.();
  }, [selectedMissing, isBatchRunning, storageReady, source, runBatch, onUpdated]);

  const handleExtractAllMissing = useCallback(async () => {
    const queue = items.filter((item) => item.status === 'missing');
    if (queue.length === 0 || isBatchRunning || !storageReady) return;

    const label = BOOK_COVER_SOURCE_LABELS[source];
    const ok = window.confirm(
      `کاور ${queue.length.toLocaleString('fa-IR')} کتاب از ${label} استخراج می‌شود.\n\nادامه؟`
    );
    if (!ok) return;

    abortRef.current = false;
    setIsBatchRunning(true);
    setBatchSummary(null);

    const { success, failed, hadWork } = await runBatch(queue, 'fetch');

    setIsBatchRunning(false);
    setBatchSummary({ success, failed, done: true });
    if (hadWork) onUpdated?.();
  }, [items, isBatchRunning, storageReady, source, runBatch, onUpdated]);

  const toggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const item of filteredItems) next.delete(item.id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const item of filteredItems) next.add(item.id);
        return next;
      });
    }
  };

  const startEditTitle = (item: BookCoverItem) => {
    if (isBusy) return;
    setEditingId(item.id);
    setEditingTitle(item.title);
  };

  const cancelEditTitle = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveTitle = async (itemId: string) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      cancelEditTitle();
      return;
    }

    const current = items.find((i) => i.id === itemId);
    if (!current || current.title === trimmed) {
      cancelEditTitle();
      return;
    }

    setSavingTitleId(itemId);
    try {
      const res = await fetch(`/api/admin/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره عنوان');

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, title: trimmed } : item))
      );
      cancelEditTitle();
      onUpdated?.();
    } catch (err: unknown) {
      alert((err as Error).message || 'خطا در ذخیره عنوان');
    } finally {
      setSavingTitleId(null);
    }
  };

  const toggleItemHidden = async (item: BookCoverItem) => {
    if (isBusy || togglingHideIds.has(item.id)) return;

    setTogglingHideIds((prev) => new Set(prev).add(item.id));
    try {
      const action = item.isHidden ? 'show' : 'hide';
      const res = await fetch('/api/admin/items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: [item.id], action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در تغییر وضعیت');
      }

      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, isHidden: !row.isHidden } : row
        )
      );
      onUpdated?.();
    } catch (err: unknown) {
      alert((err as Error).message || 'خطا در تغییر وضعیت');
    } finally {
      setTogglingHideIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isBusy, handleClose]);

  useEffect(() => {
    if (!isOpen || !fetchUrl) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setItems([]);
    setQuery('');
    setSelectedIds(new Set());
    resetBatchState();

    void fetch(fetchUrl)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری');
        if (!cancelled) {
          const loaded = (data.items || []) as BookCoverItem[];
          setItems(loaded);
          const detected = loaded.find((item) => item.detectedSource)?.detectedSource;
          if (detected) setSource(detected);
          const storageMeta = data.storage;
          setStorageReady(storageMeta?.ready !== false);
          setStorageError(storageMeta?.error || '');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError((err as Error).message || 'خطا در بارگذاری');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, fetchUrl, resetBatchState]);

  if (!isOpen || !mounted) return null;

  const showProgress = isBatchRunning || (batchSummary && batchProgress.total > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && !isBusy && handleClose()}
      dir="rtl"
    >
      <div
        className="flex h-[92vh] sm:h-auto sm:max-h-[88vh] w-full sm:max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative shrink-0 border-b border-gray-100 bg-gradient-to-l from-emerald-50/80 via-white to-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/70">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  کاور کتاب — ParsPack
                </h2>
                {!loading && items.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                    {items.length.toLocaleString('fa-IR')}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-gray-700">{scopeTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                تصاویر خارجی را انتخاب و به ParsPack منتقل کنید، یا کاور را از فیدیبو / کتابراه / طاقچه استخراج کنید.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {showProgress && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-gray-600">
                <span>{isBatchRunning ? 'در حال پردازش…' : 'پیشرفت'}</span>
                <span>
                  {batchProgress.done.toLocaleString('fa-IR')} موفق
                  {batchProgress.failed > 0 && (
                    <> · {batchProgress.failed.toLocaleString('fa-IR')} خطا</>
                  )}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${Math.max(isBatchRunning ? 4 : 0, batchProgress.percent)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {!loading && !storageReady && (
          <div className="mx-5 mt-3 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">آپلود به ParsPack غیرفعال است</p>
            <p className="mt-1 text-xs text-red-700">{storageError || 'تنظیمات Object Storage را بررسی کنید.'}</p>
            <Link href="/admin/settings" className="mt-2 inline-flex text-xs font-semibold text-red-900 underline">
              تنظیمات →
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="shrink-0 space-y-3 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={toggleSelectAllFiltered}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-emerald-700 disabled:opacity-50"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                انتخاب همه
                {selectedIds.size > 0 && (
                  <span className="text-emerald-700">({selectedIds.size.toLocaleString('fa-IR')})</span>
                )}
              </button>

              <div className="flex flex-wrap gap-1.5">
                {SOURCES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isBusy}
                    onClick={() => setSource(s)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                      source === s
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50'
                    }`}
                  >
                    {BOOK_COVER_SOURCE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isBusy}
                placeholder="جستجو در عنوان…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200/60 disabled:opacity-60"
              />
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 className="mb-3 h-9 w-9 animate-spin text-emerald-500" />
              <span className="text-sm font-medium">در حال بررسی تصاویر…</span>
            </div>
          )}

          {error && (
            <div className="mx-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && !isBatchRunning && (
            <div className="mx-1 flex flex-col items-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-14 text-center">
              <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-500" />
              <p className="text-sm font-semibold text-gray-800">
                {batchSummary?.success
                  ? `${batchSummary.success.toLocaleString('fa-IR')} کاور با موفقیت آپلود شد`
                  : 'همه تصاویر روی ParsPack هستند'}
              </p>
            </div>
          )}

          {!loading && filteredItems.length > 0 && (
            <ul className="space-y-1.5">
              {filteredItems.map((item, index) => {
                const actionState = actionMap[item.id];
                const isDone = actionState?.phase === 'done';
                const isProcessing =
                  actionState?.phase === 'fetching' || actionState?.phase === 'migrating';
                const isFailed = actionState?.phase === 'error';
                const displayUrl = actionState?.newUrl || item.imageUrl;
                const isSelected = selectedIds.has(item.id);
                const isEditing = editingId === item.id;
                const isTogglingHide = togglingHideIds.has(item.id);

                return (
                  <li
                    key={item.id}
                    className={`flex items-center gap-2 rounded-xl border px-2 py-2 sm:px-3 ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : isFailed
                          ? 'border-red-200 bg-red-50/40'
                          : isProcessing
                            ? 'border-violet-200 bg-violet-50/40'
                            : item.isHidden
                              ? 'border-gray-200 bg-gray-50/80 opacity-75'
                              : isSelected
                                ? 'border-emerald-300 bg-emerald-50/30'
                                : 'border-transparent bg-white hover:border-emerald-100'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={isBusy || isProcessing}
                      onClick={() => toggleSelect(item.id)}
                      className="shrink-0 p-0.5 text-gray-400 hover:text-emerald-600 disabled:opacity-40"
                      aria-pressed={isSelected}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    <span className="w-4 shrink-0 text-center text-[10px] font-mono text-gray-300">
                      {(index + 1).toLocaleString('fa-IR')}
                    </span>

                    <div className="relative flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
                      {isDone && displayUrl ? (
                        <Image
                          src={toAdminStorageImageSrc(displayUrl)}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : item.status === 'missing' ? (
                        <ImageOff className="h-5 w-5 text-gray-400" />
                      ) : displayUrl ? (
                        <Image src={displayUrl} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <ImageOff className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingTitle}
                            autoFocus
                            disabled={savingTitleId === item.id}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void saveTitle(item.id);
                              if (e.key === 'Escape') cancelEditTitle();
                            }}
                            className="flex-1 min-w-0 rounded-lg border border-emerald-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                          <button
                            type="button"
                            disabled={savingTitleId === item.id}
                            onClick={() => void saveTitle(item.id)}
                            className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {savingTitleId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditTitle}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <button
                            type="button"
                            onClick={() => startEditTitle(item)}
                            disabled={isBusy || isProcessing}
                            className="group/title flex min-w-0 items-center gap-1 text-right disabled:opacity-50"
                            title="ویرایش عنوان"
                          >
                            <p
                              className={`truncate text-sm font-semibold ${
                                item.isHidden ? 'text-gray-400 line-through' : 'text-gray-900'
                              }`}
                            >
                              {item.title}
                            </p>
                            <Pencil className="h-3 w-3 shrink-0 text-gray-300 opacity-0 group-hover/title:opacity-100" />
                          </button>
                          {item.isHidden && (
                            <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] font-bold text-gray-600">
                              غیرفعال
                            </span>
                          )}
                          <ActionStatusBadge state={actionState} />
                        </div>
                      )}

                      {!isEditing && (
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {item.status === 'missing' ? 'بدون تصویر — نیاز به استخراج' : 'تصویر خارجی — قابل تبدیل مستقیم'}
                          {item.detectedSource && (
                            <span className="mr-1 text-emerald-600">
                              · {BOOK_COVER_SOURCE_LABELS[item.detectedSource]}
                            </span>
                          )}
                        </p>
                      )}

                      {isFailed && actionState.error && (
                        <p className="mt-1 truncate text-[10px] text-red-600">{actionState.error}</p>
                      )}
                      {isDone && actionState.matchedTitle && (
                        <p className="mt-1 truncate text-[10px] text-emerald-700">
                          تطبیق: {actionState.matchedTitle}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center">
                      {!isProcessing && !isDone && !isEditing && (
                        <>
                          {item.status === 'external' ? (
                            <button
                              type="button"
                              onClick={() => void migrateOne(item).then((r) => r.success && onUpdated?.())}
                              disabled={isBusy || !storageReady}
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-600 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                              title="تبدیل تصویر موجود به ParsPack"
                            >
                              <Upload className="h-3 w-3" />
                              تبدیل
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void fetchOne(item).then((r) => r.success && onUpdated?.())}
                              disabled={isBusy || !storageReady}
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <Sparkles className="h-3 w-3" />
                              {BOOK_COVER_SOURCE_LABELS[source]}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => void toggleItemHidden(item)}
                            disabled={isBusy || isTogglingHide}
                            title={item.isHidden ? 'فعال کردن' : 'غیرفعال کردن'}
                            className={`inline-flex items-center justify-center rounded-lg border p-1.5 text-[10px] disabled:opacity-50 ${
                              item.isHidden
                                ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                : 'border-red-200 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {isTogglingHide ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : item.isHidden ? (
                              <Eye className="h-3.5 w-3.5" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {isFailed && (
                            <button
                              type="button"
                              onClick={() =>
                                void (item.status === 'external'
                                  ? migrateOne(item)
                                  : fetchOne(item)
                                ).then((r) => r.success && onUpdated?.())
                              }
                              disabled={isBusy}
                              title={actionState.error}
                              className="rounded p-1 text-red-500 hover:bg-red-100"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!loading && (items.length > 0 || batchSummary) && (
          <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 px-5 py-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span>
                {selectedIds.size > 0
                  ? `${selectedIds.size.toLocaleString('fa-IR')} انتخاب · ${filteredItems.length.toLocaleString('fa-IR')} نمایش`
                  : `${filteredItems.length.toLocaleString('fa-IR')} از ${items.length.toLocaleString('fa-IR')} آیتم`}
              </span>
              <span>
                {allExternalCount > 0 && `${allExternalCount.toLocaleString('fa-IR')} قابل تبدیل`}
                {allExternalCount > 0 && allMissingCount > 0 && ' · '}
                {allMissingCount > 0 && `${allMissingCount.toLocaleString('fa-IR')} بدون تصویر`}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {selectedExternal.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMigrateSelected()}
                  disabled={isBusy || !storageReady}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  <Upload className="h-3.5 w-3.5" />
                  تبدیل انتخاب‌شده ({selectedExternal.length.toLocaleString('fa-IR')})
                </button>
              )}

              {selectedMissing.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleExtractSelected()}
                  disabled={isBusy || !storageReady}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  استخراج انتخاب‌شده ({selectedMissing.length.toLocaleString('fa-IR')})
                </button>
              )}

              {selectedIds.size === 0 && allExternalCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMigrateAllExternal()}
                  disabled={isBusy || !storageReady}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  <Upload className="h-3.5 w-3.5" />
                  تبدیل همه ({allExternalCount.toLocaleString('fa-IR')})
                </button>
              )}

              {selectedIds.size === 0 && allMissingCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleExtractAllMissing()}
                  disabled={isBusy || !storageReady}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  استخراج همه از {BOOK_COVER_SOURCE_LABELS[source]}
                </button>
              )}

              {items.length === 0 && batchSummary?.done && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  بستن
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
