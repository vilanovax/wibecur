'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ImageIcon,
  ImageOff,
  Loader2,
  Pencil,
  Search,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { buildCatalogRepairSearchQuery } from '@/lib/admin/storage-image-repair';
import { buildCastandoProxyImageUrl } from '@/lib/castando-image-proxy';
import { displayInstagramHandle } from '@/lib/cafe-metadata';
import { toAdminStorageImageSrc } from '@/lib/liara-image-url';
import type { StorageImageRepairRow, StorageImageRepairStatus } from '@/lib/admin/storage-image-repair';

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

type GoogleImageResult = {
  title: string;
  link: string;
  thumbnail: string;
  width: number;
  height: number;
  contextLink?: string;
};

type ItemSearchState = {
  query: string;
  results: GoogleImageResult[];
  loading: boolean;
  error: string;
};

type ItemActionState = {
  phase: 'idle' | 'searching' | 'applying' | 'migrating' | 'done' | 'error';
  error?: string;
  newUrl?: string;
};

const PAGE_SIZE = 12;

type StorageImageRepairClientProps = {
  categories: CategoryOption[];
  initialCategorySlug: string;
  initialStatus: 'all' | StorageImageRepairStatus;
  initialQ: string;
};

function resolvePreviewSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('/images/banners/') && url.endsWith('.jpg')) {
    return `${url.slice(0, -4)}.webp`;
  }
  if (url.includes('parspack') || url.includes('liara')) return toAdminStorageImageSrc(url);
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return url;
  return url;
}

function ActionStatusBadge({ state }: { state: ItemActionState | undefined }) {
  if (!state || state.phase === 'idle') return null;

  if (state.phase === 'searching' || state.phase === 'applying' || state.phase === 'migrating') {
    const label =
      state.phase === 'searching'
        ? 'در حال جستجو…'
        : state.phase === 'migrating'
          ? 'در حال انتقال…'
          : 'در حال ذخیره…';
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        {label}
      </span>
    );
  }

  if (state.phase === 'done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        ذخیره شد
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
      title={state.error}
    >
      <AlertCircle className="h-3 w-3" />
      خطا
    </span>
  );
}

function ImagePathBlock({
  label,
  url,
  tone = 'default',
}: {
  label: string;
  url: string;
  tone?: 'default' | 'success' | 'muted';
}) {
  if (!url) return null;
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
      : tone === 'muted'
        ? 'border-gray-200 bg-white text-[var(--color-text-muted)]'
        : 'border-orange-200 bg-orange-50/50 text-orange-950';

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${toneClass}`}>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      <p className="mt-1 break-all font-mono text-xs leading-relaxed" dir="ltr">
        {url}
      </p>
    </div>
  );
}

export default function StorageImageRepairClient({
  categories,
  initialCategorySlug,
  initialStatus,
  initialQ,
}: StorageImageRepairClientProps) {
  const [items, setItems] = useState<StorageImageRepairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storageReady, setStorageReady] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);
  const [status, setStatus] = useState<'all' | StorageImageRepairStatus>(initialStatus);
  const [queryInput, setQueryInput] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Record<string, GoogleImageResult | null>>({});
  const [searchMap, setSearchMap] = useState<Record<string, ItemSearchState>>({});
  const [actionMap, setActionMap] = useState<Record<string, ItemActionState>>({});
  const [useCastandoProxyMap, setUseCastandoProxyMap] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(queryInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  const fetchUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (categorySlug && categorySlug !== 'all') params.set('categorySlug', categorySlug);
    const qs = params.toString();
    return `/api/admin/catalog/storage-image-repair${qs ? `?${qs}` : ''}`;
  }, [categorySlug]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(fetchUrl);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری');
      setItems((data.items || []) as StorageImageRepairRow[]);
      const storageMeta = data.storage;
      setStorageReady(storageMeta?.ready !== false);
      setStorageError(storageMeta?.error || '');
    } catch (err: unknown) {
      setError((err as Error).message || 'خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (categorySlug !== 'all') params.set('categorySlug', categorySlug);
    if (status !== 'all') params.set('status', status);
    if (debouncedQuery) params.set('q', debouncedQuery);
    const qs = params.toString();
    const next = `/admin/catalog/storage-images${qs ? `?${qs}` : ''}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [categorySlug, status, debouncedQuery]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedQuery, categorySlug]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((row) => row.id !== id));
    setExpandedId((prev) => (prev === id ? null : prev));
    setSelectedCandidate((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSearchMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActionMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const runSearch = useCallback(
    async (item: StorageImageRepairRow, overrideQuery?: string) => {
      const defaultQuery =
        overrideQuery?.trim() ||
        searchMap[item.id]?.query ||
        buildCatalogRepairSearchQuery({
          title: item.title,
          categorySlug: item.categorySlug,
          metadata: item.metadata,
        });

      setSearchMap((prev) => ({
        ...prev,
        [item.id]: {
          query: defaultQuery,
          results: prev[item.id]?.results || [],
          loading: true,
          error: '',
        },
      }));
      setActionMap((prev) => ({ ...prev, [item.id]: { phase: 'searching' } }));

      try {
        const res = await fetch(`/api/admin/catalog/${item.id}/search-repair-photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: defaultQuery }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error((data.error as string) || 'خطا در جستجو');

        setSearchMap((prev) => ({
          ...prev,
          [item.id]: {
            query: (data.query as string) || defaultQuery,
            results: (data.results as GoogleImageResult[]) || [],
            loading: false,
            error: data.results?.length ? '' : 'هیچ تصویری یافت نشد',
          },
        }));
        setActionMap((prev) => ({ ...prev, [item.id]: { phase: 'idle' } }));
      } catch (err: unknown) {
        const message = (err as Error).message || 'خطا در جستجو';
        setSearchMap((prev) => ({
          ...prev,
          [item.id]: {
            query: defaultQuery,
            results: [],
            loading: false,
            error: message,
          },
        }));
        setActionMap((prev) => ({ ...prev, [item.id]: { phase: 'error', error: message } }));
      }
    },
    [searchMap]
  );

  const applyPhoto = useCallback(
    async (item: StorageImageRepairRow, imageUrl: string, useCastandoProxy: boolean) => {
      const ok = window.confirm(`این تصویر برای «${item.title}» روی ParsPack ذخیره شود؟`);
      if (!ok) return;

      setActionMap((prev) => ({ ...prev, [item.id]: { phase: 'applying' } }));
      try {
        const res = await fetch(`/api/admin/catalog/${item.id}/apply-repair-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, useCastandoProxy }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error((data.error as string) || 'خطا در ذخیره');

        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'done', newUrl: (data.newUrl as string) || '' },
        }));
        window.setTimeout(() => removeItem(item.id), 900);
      } catch (err: unknown) {
        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'error', error: (err as Error).message || 'خطا' },
        }));
      }
    },
    [removeItem]
  );

  const migrateExternal = useCallback(
    async (
      item: StorageImageRepairRow,
      useCastandoProxy: boolean
    ): Promise<{ success: boolean; stopBatch?: boolean }> => {
      setActionMap((prev) => ({ ...prev, [item.id]: { phase: 'migrating' } }));
      try {
        const res = await fetch(`/api/admin/catalog/${item.id}/apply-repair-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ migrateExternal: true, useCastandoProxy }),
        });
        const data = await res.json();
        if (!res.ok) {
          const message = (data.error as string) || 'خطا در تبدیل';
          const stopBatch = res.status === 503;
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

        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'done', newUrl: (data.newUrl as string) || '' },
        }));
        window.setTimeout(() => removeItem(item.id), 900);
        return { success: true };
      } catch (err: unknown) {
        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'error', error: (err as Error).message || 'خطا' },
        }));
        return { success: false };
      }
    },
    [removeItem]
  );

  const filteredItems = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.imageUrl.toLowerCase().includes(q) ||
        item.host.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [items, status, debouncedQuery]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const missingTotal = useMemo(
    () => items.filter((item) => item.status === 'missing').length,
    [items]
  );
  const externalTotal = useMemo(
    () => items.filter((item) => item.status === 'external').length,
    [items]
  );

  const copyImageLink = useCallback(async (itemId: string, url: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const area = document.createElement('textarea');
      area.value = url;
      area.setAttribute('readonly', '');
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopiedId(itemId);
    window.setTimeout(() => {
      setCopiedId((current) => (current === itemId ? null : current));
    }, 1500);
  }, []);

  const handleMigrateAllExternal = useCallback(async () => {
    const queue = filteredItems.filter((item) => item.status === 'external');
    if (queue.length === 0 || isBatchRunning || !storageReady) return;

    const ok = window.confirm(
      `${queue.length.toLocaleString('fa-IR')} تصویر خارجی به ParsPack منتقل می‌شود.\n\nادامه؟`
    );
    if (!ok) return;

    setIsBatchRunning(true);
    for (const item of queue) {
      const useCastandoProxy = useCastandoProxyMap[item.id] === true;
      const result = await migrateExternal(item, useCastandoProxy);
      if (result.stopBatch) break;
      await new Promise((r) => window.setTimeout(r, 400));
    }
    setIsBatchRunning(false);
  }, [filteredItems, isBatchRunning, storageReady, migrateExternal, useCastandoProxyMap]);

  const openItemSearch = useCallback(
    (item: StorageImageRepairRow) => {
      setExpandedId(item.id);
      if (!searchMap[item.id]) {
        void runSearch(item);
      }
    },
    [runSearch, searchMap]
  );

  const toggleDetails = useCallback((itemId: string) => {
    setExpandedId((prev) => (prev === itemId ? null : itemId));
  }, []);

  const externalInFilter = filteredItems.filter((item) => item.status === 'external').length;

  return (
    <div className="space-y-4" dir="rtl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/admin/lists?view=catalog"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <ArrowRight className="size-4" />
            بازگشت به مرکز محتوا
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-[var(--color-text)]">
            <ImageIcon className="size-5 text-orange-700" />
            لینک تصاویر
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            لینک خارجی را ببینید، کپی کنید، یا روی ParsPack ذخیره کنید.
          </p>
        </div>
      </header>

      {!storageReady && storageError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {storageError}
        </div>
      )}

      <section className="space-y-3 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatus('all')}
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold ring-1 ${
              status === 'all'
                ? 'bg-[var(--color-text)] text-white ring-[var(--color-text)]'
                : 'bg-[var(--color-bg)] text-[var(--color-text)] ring-[var(--color-border-muted)]'
            }`}
          >
            {items.length.toLocaleString('fa-IR')} در صف
          </button>
          <button
            type="button"
            onClick={() => setStatus((value) => (value === 'missing' ? 'all' : 'missing'))}
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold ring-1 ${
              status === 'missing'
                ? 'bg-sky-600 text-white ring-sky-600'
                : 'bg-sky-50 text-sky-900 ring-sky-200'
            }`}
          >
            {missingTotal.toLocaleString('fa-IR')} بدون تصویر
          </button>
          <button
            type="button"
            onClick={() => setStatus((value) => (value === 'external' ? 'all' : 'external'))}
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold ring-1 ${
              status === 'external'
                ? 'bg-amber-600 text-white ring-amber-600'
                : 'bg-amber-50 text-amber-900 ring-amber-200'
            }`}
          >
            {externalTotal.toLocaleString('fa-IR')} لینک خارجی
          </button>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="جستجو در عنوان یا لینک تصویر…"
              className="min-h-11 w-full rounded-xl border border-[var(--color-border-muted)] bg-white pe-10 ps-3 text-sm"
            />
          </div>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            aria-label="دسته"
            className="min-h-11 rounded-xl border border-[var(--color-border-muted)] bg-white px-3 text-sm lg:w-52"
          >
            <option value="all">همه دسته‌ها</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.icon || '📁'} {cat.name}
              </option>
            ))}
          </select>
          {externalInFilter > 0 && (
            <button
              type="button"
              onClick={() => void handleMigrateAllExternal()}
              disabled={isBatchRunning || !storageReady || loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isBatchRunning ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              انتقال {externalInFilter.toLocaleString('fa-IR')} لینک
            </button>
          )}
        </div>
      </section>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border-muted)] py-16 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          در حال بارگذاری…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-900">همه موجودیت‌ها تصویر ParsPack دارند.</p>
          <Link
            href="/admin/lists?view=catalog"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            بازگشت به کاتالوگ
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] py-10 text-center text-sm text-[var(--color-text-muted)]">
          با این فیلتر لینکی پیدا نشد.
        </p>
      )}

      {pageRows.length > 0 && (
      <ul className="overflow-hidden rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)]">
        {pageRows.map((item) => {
          const isExpanded = expandedId === item.id;
          const searchState = searchMap[item.id];
          const actionState = actionMap[item.id];
          const candidate = selectedCandidate[item.id];
          const isExternal = item.status === 'external';
          const currentUrl = actionState?.newUrl || item.imageUrl;
          const previewSrc =
            currentUrl && !currentUrl.includes('placeholder') ? resolvePreviewSrc(currentUrl) : '';
          const isBusy =
            actionState?.phase === 'searching' ||
            actionState?.phase === 'applying' ||
            actionState?.phase === 'migrating';
          const useCastandoProxy = useCastandoProxyMap[item.id] === true;
          const proxyDownloadUrl = candidate?.link
            ? buildCastandoProxyImageUrl(candidate.link)
            : buildCastandoProxyImageUrl(item.imageUrl);
          const linkIsHttp = item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://');

          return (
            <li
              key={item.id}
              className={`border-b border-[var(--color-border-muted)] p-3 last:border-b-0 ${
                isExpanded ? 'bg-orange-50/40' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-bg)] aspect-square">
                  {previewSrc ? (
                    <Image src={previewSrc} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                      <ImageOff className="size-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-[var(--color-text)]">{item.title}</h2>
                    <span className="text-xs text-[var(--color-text-muted)]">{item.categoryLabel}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isExternal ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {isExternal ? 'لینک خارجی' : 'بدون تصویر'}
                    </span>
                    <ActionStatusBadge state={actionState} />
                  </div>

                  {item.imageUrl ? (
                    <div className="mt-2 flex items-center gap-2">
                      {linkIsHttp ? (
                        <a
                          href={item.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          title={item.imageUrl}
                          className="min-w-0 flex-1 truncate text-xs text-[var(--color-text)] hover:underline"
                        >
                          {item.imageUrl}
                        </a>
                      ) : (
                        <p dir="ltr" title={item.imageUrl} className="min-w-0 flex-1 truncate text-xs text-[var(--color-text)]">
                          {item.imageUrl}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => void copyImageLink(item.id, item.imageUrl)}
                        className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-[var(--color-border-muted)] px-3 text-xs font-semibold"
                      >
                        <Copy className="size-4" />
                        {copiedId === item.id ? 'کپی شد' : 'کپی لینک'}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">لینکی ثبت نشده</p>
                  )}

                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {item.host !== '—' ? item.host : 'بدون میزبان'}
                    {' · '}
                    {item.listCount.toLocaleString('fa-IR')} جایگذاری
                    {item.instagram ? ` · ${displayInstagramHandle(item.instagram)}` : ''}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isExternal && (
                      <button
                        type="button"
                        onClick={() => void migrateExternal(item, useCastandoProxy)}
                        disabled={!storageReady || isBusy || isBatchRunning}
                        className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        {actionState?.phase === 'migrating' ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Upload className="size-4" />
                        )}
                        انتقال
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => (isExpanded ? toggleDetails(item.id) : openItemSearch(item))}
                      disabled={isBusy}
                      className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-orange-200 bg-orange-50 px-3 text-sm font-semibold text-orange-800 disabled:opacity-50"
                    >
                      {searchState?.loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Search className="size-4" />
                      )}
                      {isExpanded ? 'بستن جستجو' : 'جستجو'}
                    </button>
                    <Link
                      href={`/admin/catalog/${item.id}/edit`}
                      className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[var(--color-border-muted)] px-3 text-sm font-semibold"
                    >
                      <Pencil className="size-4" />
                      ویرایش
                    </Link>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[var(--color-border-muted)] bg-[var(--color-bg)]/40 px-3 py-4 sm:px-4">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <ImagePathBlock label="آدرس فعلی" url={item.imageUrl} tone="muted" />
                    {candidate && (
                      <ImagePathBlock label="تصویر انتخاب‌شده" url={candidate.link} />
                    )}
                    {actionState?.newUrl && (
                      <ImagePathBlock label="آدرس ParsPack جدید" url={actionState.newUrl} tone="success" />
                    )}
                  </div>

                  {isExternal && (
                    <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                      تصویر فعلی خارج از ParsPack است — «انتقال» همان URL را ذخیره می‌کند، یا با
                      جستجوی Google تصویر جدید انتخاب کنید.
                    </p>
                  )}

                  <label className="mt-3 inline-flex min-h-11 cursor-pointer items-start gap-2 rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-2.5 text-xs text-sky-950">
                    <input
                      type="checkbox"
                      checked={useCastandoProxy}
                      onChange={(e) =>
                        setUseCastandoProxyMap((prev) => ({
                          ...prev,
                          [item.id]: e.target.checked,
                        }))
                      }
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-sky-300 text-sky-600 focus:ring-sky-500/30"
                    />
                    <span>
                      <span className="font-semibold">پراکسی castando (اختیاری)</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-sky-800/90">
                        فقط برای سایت‌های فیلترشده — در صورت نیاز تیک بزنید
                      </span>
                      {useCastandoProxy && (candidate?.link || item.imageUrl) && (
                        <span className="mt-1 block break-all font-mono text-xs text-sky-800/90" dir="ltr">
                          castando.ir/wibe/image-proxy.php?url=
                          {candidate?.link || item.imageUrl}
                        </span>
                      )}
                    </span>
                  </label>

                  {useCastandoProxy && (candidate?.link || item.imageUrl) && (
                    <div className="mt-2">
                      <ImagePathBlock label="آدرس دانلود با پراکسی" url={proxyDownloadUrl} />
                    </div>
                  )}

                  <>
                      {candidate && (
                        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-3">
                          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10">
                            <Image
                              src={candidate.thumbnail || candidate.link}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-emerald-900">تصویر انتخاب‌شده</p>
                            <p className="mt-0.5 truncate text-xs text-emerald-800/80" dir="ltr">
                              {candidate.link}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void applyPhoto(item, candidate.link, useCastandoProxy)}
                            disabled={!storageReady || actionState?.phase === 'applying'}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {actionState?.phase === 'applying' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            تأیید و آپلود
                          </button>
                        </div>
                      )}

                      <div className={`flex flex-wrap items-center gap-2 ${candidate ? 'mt-3' : 'mt-4'}`}>
                        <input
                          type="text"
                          value={
                            searchState?.query ||
                            buildCatalogRepairSearchQuery({
                              title: item.title,
                              categorySlug: item.categorySlug,
                              metadata: item.metadata,
                            })
                          }
                          onChange={(e) =>
                            setSearchMap((prev) => ({
                              ...prev,
                              [item.id]: {
                                query: e.target.value,
                                results: prev[item.id]?.results || [],
                                loading: false,
                                error: '',
                              },
                            }))
                          }
                          className="min-h-11 min-w-48 flex-1 rounded-xl border border-[var(--color-border-muted)] bg-white px-3 text-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200/60"
                          placeholder="عبارت جستجو…"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void runSearch(
                              item,
                              searchMap[item.id]?.query ||
                                buildCatalogRepairSearchQuery({
                                  title: item.title,
                                  categorySlug: item.categorySlug,
                                  metadata: item.metadata,
                                })
                            )
                          }
                          disabled={searchState?.loading}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                          {searchState?.loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Search className="h-3.5 w-3.5" />
                          )}
                          جستجوی Google
                        </button>
                      </div>

                      {searchState?.error && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {searchState.error}
                        </p>
                      )}

                      {searchState?.results && searchState.results.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold text-[var(--color-text-muted)]">
                            {searchState.results.length.toLocaleString('fa-IR')} نتیجه — یکی را انتخاب کنید
                          </p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                            {searchState.results.map((result) => {
                              const selected = candidate?.link === result.link;
                              return (
                                <button
                                  key={result.link}
                                  type="button"
                                  onClick={() =>
                                    setSelectedCandidate((prev) => ({
                                      ...prev,
                                      [item.id]: result,
                                    }))
                                  }
                                  className={`group relative aspect-[4/3] overflow-hidden rounded-xl border bg-white transition-all ${
                                    selected
                                      ? 'border-orange-500 ring-2 ring-orange-300'
                                      : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
                                  }`}
                                >
                                  <Image
                                    src={result.thumbnail || result.link}
                                    alt={result.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                  {selected && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-orange-600/25">
                                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white shadow">
                                        <Check className="h-4 w-4" />
                                      </span>
                                    </span>
                                  )}
                                  {(result.width > 0 || result.height > 0) && (
                                    <span className="absolute bottom-1 end-1 rounded bg-black/60 px-1 py-0.5 text-xs font-mono text-white" dir="ltr">
                                      {result.width}×{result.height}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </>

                  {actionState?.phase === 'error' && actionState.error && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {actionState.error}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      )}

      {pageCount > 1 && filteredItems.length > 0 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--color-border-muted)] bg-white px-3 text-sm disabled:opacity-40"
          >
            صفحه قبل
          </button>
          <span className="text-sm text-[var(--color-text-muted)]">
            صفحه {safePage.toLocaleString('fa-IR')} از {pageCount.toLocaleString('fa-IR')}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount}
            onClick={() => setPage(safePage + 1)}
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--color-border-muted)] bg-white px-3 text-sm disabled:opacity-40"
          >
            صفحه بعد
          </button>
        </div>
      )}
    </div>
  );
}
