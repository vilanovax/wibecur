'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Link2,
  Loader2,
  ExternalLink,
  Pencil,
  Copy,
  Check,
  Search,
  CloudOff,
  Sparkles,
  Upload,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { toAdminStorageImageSrc } from '@/lib/liara-image-url';

function resolveModalImageSrc(url: string): string {
  if (!url) return '';
  if (isOurStorageUrl(url)) return toAdminStorageImageSrc(url);
  return url;
}

type ExternalImageItem = {
  id: string;
  title: string;
  order: number;
  listId: string;
  listTitle: string;
  imageUrl: string;
  host: string;
};

type ItemMigratePhase = 'idle' | 'converting' | 'done' | 'error';

type ItemMigrateState = {
  phase: ItemMigratePhase;
  newUrl?: string;
  error?: string;
};

type ExternalImageItemsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  scopeTitle: string;
  mode?: 'items' | 'catalog';
  listId?: string;
  categoryId?: string;
  catalogFilters?: {
    categorySlug?: string;
    listId?: string;
    multiListOnly?: boolean;
  };
  onMigrated?: () => void;
};

function hostLabel(host: string): string {
  if (host.includes('tmdb')) return 'TMDb';
  if (host.includes('amazon') || host.includes('imdb')) return 'IMDb / Amazon';
  if (host.includes('google')) return 'Google';
  if (host.includes('wikimedia')) return 'Wikimedia';
  return host || 'خارجی';
}

function hostColor(host: string): string {
  if (host.includes('tmdb')) return 'bg-sky-100 text-sky-800 ring-sky-200/60';
  if (host.includes('amazon') || host.includes('imdb')) return 'bg-yellow-100 text-yellow-900 ring-yellow-200/60';
  if (host.includes('google')) return 'bg-emerald-100 text-emerald-800 ring-emerald-200/60';
  return 'bg-amber-100 text-amber-900 ring-amber-200/60';
}

function CopyUrlButton({ url, disabled }: { url: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      title={url}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40 disabled:pointer-events-none"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-600" />
          <span className="text-emerald-600">کپی شد</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>کپی URL</span>
        </>
      )}
    </button>
  );
}

function MigrateStatusBadge({ state }: { state: ItemMigrateState | undefined }) {
  if (!state || state.phase === 'idle') return null;

  if (state.phase === 'converting') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
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

export default function ExternalImageItemsModal({
  isOpen,
  onClose,
  scopeTitle,
  mode = 'items',
  listId,
  categoryId,
  catalogFilters,
  onMigrated,
}: ExternalImageItemsModalProps) {
  const [items, setItems] = useState<ExternalImageItem[]>([]);
  const [scope, setScope] = useState<'list' | 'category' | 'catalog'>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [hostFilter, setHostFilter] = useState<string>('all');
  const [migrateMap, setMigrateMap] = useState<Record<string, ItemMigrateState>>({});
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateSummary, setMigrateSummary] = useState<{
    success: number;
    failed: number;
    done: boolean;
  } | null>(null);
  const [storageReady, setStorageReady] = useState(true);
  const [storageError, setStorageError] = useState('');
  const abortRef = useRef(false);

  const fetchUrl = useMemo(() => {
    if (mode === 'catalog') {
      const p = new URLSearchParams();
      if (catalogFilters?.categorySlug) {
        p.set('categorySlug', catalogFilters.categorySlug);
      }
      if (catalogFilters?.listId) {
        p.set('listId', catalogFilters.listId);
      }
      if (catalogFilters?.multiListOnly) {
        p.set('multiList', '1');
      }
      return `/api/admin/catalog/external-image-urls?${p.toString()}`;
    }
    if (listId) {
      return `/api/admin/items/external-image-urls?listId=${encodeURIComponent(listId)}`;
    }
    if (categoryId) {
      return `/api/admin/items/external-image-urls?categoryId=${encodeURIComponent(categoryId)}`;
    }
    return null;
  }, [mode, listId, categoryId, catalogFilters]);

  const hostStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const key = item.host || 'unknown';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([host, count]) => ({ host, count, label: hostLabel(host) }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (hostFilter !== 'all' && item.host !== hostFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.listTitle.toLowerCase().includes(q) ||
        item.host.toLowerCase().includes(q)
      );
    });
  }, [items, query, hostFilter]);

  const [migrateTotal, setMigrateTotal] = useState(0);

  const migrateProgress = useMemo(() => {
    const total = migrateTotal || items.length;
    if (total === 0) return { done: 0, failed: 0, total: 0, percent: 0 };
    const done = Object.values(migrateMap).filter((s) => s.phase === 'done').length;
    const failed = Object.values(migrateMap).filter((s) => s.phase === 'error').length;
    const processed = done + failed;
    return {
      done,
      failed,
      total,
      percent: Math.round((processed / total) * 100),
    };
  }, [items.length, migrateMap, migrateTotal]);

  const resetMigrationState = useCallback(() => {
    setMigrateMap({});
    setIsMigrating(false);
    setMigrateSummary(null);
    setMigrateTotal(0);
    abortRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    if (isMigrating) {
      const ok = window.confirm('تبدیل در حال انجام است. مطمئنید می‌خواهید ببندید؟');
      if (!ok) return;
      abortRef.current = true;
    }
    setQuery('');
    setHostFilter('all');
    resetMigrationState();
    onClose();
  }, [isMigrating, onClose, resetMigrationState]);

  const migrateOne = useCallback(
    async (
      item: ExternalImageItem
    ): Promise<{ success: boolean; stopBatch?: boolean }> => {
      setMigrateMap((prev) => ({
        ...prev,
        [item.id]: { phase: 'converting' },
      }));

      try {
        const migratePath =
          mode === 'catalog'
            ? `/api/admin/catalog/${item.id}/migrate-image`
            : `/api/admin/items/${item.id}/migrate-image`;
        const res = await fetch(migratePath, {
          method: 'POST',
        });
        const data = await res.json();

        if (!res.ok) {
          const message = (data.error as string) || 'خطا در تبدیل';
          const stopBatch =
            res.status === 503 ||
            data.errorCode === 'storage_not_configured' ||
            data.errorCode === 'liara_not_configured';

          if (stopBatch) {
            setStorageReady(false);
            setStorageError(message);
          }

          setMigrateMap((prev) => ({
            ...prev,
            [item.id]: { phase: 'error', error: message },
          }));

          return { success: false, stopBatch };
        }

        const newUrl = (data.newUrl as string) || item.imageUrl;

        setMigrateMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'done', newUrl },
        }));

        window.setTimeout(() => {
          setItems((prev) => prev.filter((row) => row.id !== item.id));
          setMigrateMap((prev) => {
            const next = { ...prev };
            delete next[item.id];
            return next;
          });
        }, 900);

        const success =
          data.status === 'migrated' ||
          data.status === 'already_on_storage' ||
          data.status === 'already_liara';
        return { success };
      } catch (err: unknown) {
        const message = (err as Error).message || 'خطا در تبدیل';
        setMigrateMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'error', error: message },
        }));
        return { success: false };
      }
    },
    [mode]
  );

  const handleMigrateAll = useCallback(async () => {
    if (items.length === 0 || isMigrating || !storageReady) return;

    const queue = items.filter((item) => !isOurStorageUrl(item.imageUrl));
    if (queue.length === 0) return;

    const ok = window.confirm(
      `${queue.length.toLocaleString('fa-IR')} تصویر دانلود، بهینه (WebP ~۱۰۰۰px) و روی ParsPack آپلود می‌شود.\n\nادامه می‌دهید؟`
    );
    if (!ok) return;

    abortRef.current = false;
    setIsMigrating(true);
    setMigrateSummary(null);
    setMigrateMap({});
    setMigrateTotal(queue.length);

    let success = 0;
    let failed = 0;
    let hadMigration = false;

    for (const item of queue) {
      if (abortRef.current) break;

      const result = await migrateOne(item);
      if (result.success) {
        success++;
        hadMigration = true;
      } else {
        failed++;
        if (result.stopBatch) {
          abortRef.current = true;
          break;
        }
      }

      if (!abortRef.current) {
        await new Promise((r) => window.setTimeout(r, 350));
      }
    }

    setIsMigrating(false);
    setMigrateSummary({ success, failed, done: true });

    if (hadMigration) {
      onMigrated?.();
    }
  }, [items, isMigrating, storageReady, migrateOne, onMigrated]);

  const handleRetryOne = useCallback(
    async (item: ExternalImageItem) => {
      if (isMigrating || !storageReady) return;
      setIsMigrating(true);
      const result = await migrateOne(item);
      setIsMigrating(false);
      if (result.success) onMigrated?.();
    },
    [isMigrating, storageReady, migrateOne, onMigrated]
  );

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMigrating) handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isMigrating, handleClose]);

  useEffect(() => {
    if (!isOpen || !fetchUrl) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setItems([]);
    setQuery('');
    setHostFilter('all');
    resetMigrationState();

    void fetch(fetchUrl)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری');
        if (!cancelled) {
          setItems(data.items || []);
          setScope(
            data.scope === 'catalog'
              ? 'catalog'
              : data.scope === 'category'
                ? 'category'
                : 'list'
          );
          const storageMeta = data.storage || data.liara;
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
  }, [isOpen, fetchUrl, resetMigrationState]);

  if (!isOpen || !mounted) return null;

  const showProgress = isMigrating || (migrateSummary && migrateProgress.total > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && !isMigrating && handleClose()}
      dir="rtl"
    >
      <div
        className="flex h-[92vh] sm:h-auto sm:max-h-[88vh] w-full sm:max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="external-images-title"
      >
        {/* Header */}
        <div className="relative shrink-0 border-b border-gray-100 bg-gradient-to-l from-amber-50/80 via-white to-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-amber-200/70">
              <CloudOff className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="external-images-title" className="text-base sm:text-lg font-bold text-gray-900">
                  S3
                </h2>
                {!loading && items.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                    {items.length.toLocaleString('fa-IR')}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-gray-700">{scopeTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                دانلود، بهینه‌سازی WebP (حداکثر ~۱۰۰۰px) و آپلود به ParsPack
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
                <span>
                  {isMigrating
                    ? 'در حال تبدیل تصاویر…'
                    : migrateSummary?.done
                      ? 'تبدیل پایان یافت'
                      : 'پیشرفت'}
                </span>
                <span>
                  {migrateProgress.done.toLocaleString('fa-IR')} موفق
                  {migrateProgress.failed > 0 && (
                    <> · {migrateProgress.failed.toLocaleString('fa-IR')} خطا</>
                  )}
                  {' / '}
                  {migrateProgress.total.toLocaleString('fa-IR')}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-violet-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(isMigrating ? 4 : 0, migrateProgress.percent)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Storage config warning */}
        {!loading && !storageReady && (
          <div className="mx-5 mt-3 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">تبدیل تصاویر غیرفعال است</p>
            <p className="mt-1 text-xs leading-relaxed text-red-700">
              {storageError ||
                'Access Key و Secret Key مربوط به ParsPack Object Storage در تنظیمات ادمین وارد نشده است.'}
            </p>
            <Link
              href="/admin/settings"
              className="mt-2 inline-flex text-xs font-semibold text-red-900 underline hover:no-underline"
            >
              رفتن به تنظیمات Object Storage →
            </Link>
          </div>
        )}

        {/* Toolbar */}
        {!loading && !error && items.length > 0 && (
          <div className="shrink-0 space-y-3 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isMigrating}
                placeholder="جستجو در عنوان یا لیست…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200/60 disabled:opacity-60"
              />
            </div>

            {hostStats.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={isMigrating}
                  onClick={() => setHostFilter('all')}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                    hostFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
                  }`}
                >
                  همه ({items.length.toLocaleString('fa-IR')})
                </button>
                {hostStats.map(({ host, count, label }) => (
                  <button
                    key={host}
                    type="button"
                    disabled={isMigrating}
                    onClick={() => setHostFilter(host)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                      hostFilter === host
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-amber-50'
                    }`}
                  >
                    {label} ({count.toLocaleString('fa-IR')})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 className="mb-3 h-9 w-9 animate-spin text-amber-500" />
              <span className="text-sm font-medium">در حال بررسی تصاویر…</span>
            </div>
          )}

          {error && (
            <div className="mx-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && !isMigrating && (
            <div className="mx-1 flex flex-col items-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                {migrateSummary?.success ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Sparkles className="h-6 w-6" />
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {migrateSummary?.success
                  ? `${migrateSummary.success.toLocaleString('fa-IR')} تصویر با موفقیت به ParsPack منتقل شد`
                  : 'همه تصاویر روی ParsPack هستند'}
              </p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">
                {migrateSummary?.failed
                  ? `${migrateSummary.failed.toLocaleString('fa-IR')} مورد با خطا مواجه شد — می‌توانید دوباره تلاش کنید.`
                  : scope === 'catalog'
                    ? 'هیچ موجودیتی در این فیلتر با تصویر خارجی پیدا نشد.'
                    : scope === 'category'
                      ? 'هیچ آیتمی در این دسته با تصویر خارجی پیدا نشد.'
                      : 'هیچ آیتمی در این لیست با تصویر خارجی پیدا نشد.'}
              </p>
            </div>
          )}

          {!loading && items.length > 0 && filteredItems.length === 0 && (
            <div className="mx-1 rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
              نتیجه‌ای برای «{query}» پیدا نشد.
            </div>
          )}

          {!loading && filteredItems.length > 0 && (
            <ul className="space-y-1.5">
              {filteredItems.map((item, index) => {
                const migrateState = migrateMap[item.id];
                const isDone = migrateState?.phase === 'done';
                const isConverting = migrateState?.phase === 'converting';
                const isFailed = migrateState?.phase === 'error';
                const displayUrl = migrateState?.newUrl || item.imageUrl;
                const imageSrc = resolveModalImageSrc(displayUrl);

                return (
                  <li
                    key={item.id}
                    className={`group flex items-center gap-3 rounded-xl border px-2.5 py-2 transition-all sm:px-3 ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : isFailed
                          ? 'border-red-200 bg-red-50/40'
                          : isConverting
                            ? 'border-violet-200 bg-violet-50/40'
                            : 'border-transparent bg-white hover:border-amber-100 hover:bg-amber-50/30'
                    }`}
                  >
                    <div className="relative flex w-6 shrink-0 flex-col items-center gap-1">
                      <span className="text-[10px] font-mono text-gray-300">
                        {(index + 1).toLocaleString('fa-IR')}
                      </span>
                      {isDone && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-in fade-in zoom-in duration-300" />
                      )}
                      {isConverting && (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                      )}
                      {isFailed && (
                        <button
                          type="button"
                          onClick={() => void handleRetryOne(item)}
                          disabled={isMigrating}
                          title={migrateState.error}
                          className="rounded p-0.5 text-red-500 hover:bg-red-100 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="relative h-[4.5rem] w-8 shrink-0 overflow-hidden rounded-md bg-gray-200 shadow-sm ring-1 ring-black/5 sm:h-16 sm:w-11 sm:rounded-lg">
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        className={`object-cover transition-opacity ${isDone ? 'opacity-90' : ''}`}
                        unoptimized
                      />
                      {isDone && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/20">
                          <Check className="h-5 w-5 text-white drop-shadow" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {mode !== 'catalog' && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                          #{item.order}
                        </span>
                      )}
                      <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
                      <MigrateStatusBadge state={migrateState} />
                    </div>

                    {(scope === 'category' || scope === 'catalog') && (
                      <p className="mt-0.5 truncate text-[11px] text-violet-600">{item.listTitle}</p>
                    )}

                      {!isDone && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${hostColor(item.host)}`}
                          >
                            <Link2 className="h-2.5 w-2.5 opacity-70" />
                            {hostLabel(item.host)}
                          </span>
                          <CopyUrlButton url={item.imageUrl} disabled={isMigrating} />
                        </div>
                      )}

                      {isFailed && migrateState.error && (
                        <p className="mt-1 truncate text-[10px] text-red-600">{migrateState.error}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {!isConverting && !isDone && (
                        <>
                          <Link
                            href={
                              mode === 'catalog'
                                ? `/admin/catalog/${item.id}/edit`
                                : `/admin/items/${item.id}/edit`
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-violet-700 sm:px-3 sm:text-xs"
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="hidden sm:inline">ویرایش</span>
                          </Link>
                          <a
                            href={item.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="باز کردن تصویر"
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!loading && (items.length > 0 || migrateSummary) && (
          <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-gray-500">
                {items.length > 0 ? (
                  <>
                    {filteredItems.length.toLocaleString('fa-IR')} از{' '}
                    {items.length.toLocaleString('fa-IR')} آیتم
                  </>
                ) : migrateSummary ? (
                  <>
                    {migrateSummary.success.toLocaleString('fa-IR')} موفق
                    {migrateSummary.failed > 0 &&
                      ` · ${migrateSummary.failed.toLocaleString('fa-IR')} خطا`}
                  </>
                ) : null}
              </span>

              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void handleMigrateAll()}
                  disabled={isMigrating || !storageReady}
                  title={!storageReady ? storageError : undefined}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-violet-600 to-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-violet-700 hover:to-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال تبدیل…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      تبدیل {items.length.toLocaleString('fa-IR')} تصویر به ParsPack
                    </>
                  )}
                </button>
              ) : migrateSummary?.done ? (
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  بستن
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
