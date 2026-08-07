'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  ImageOff,
  Loader2,
  Search,
  Upload,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { buildCatalogRepairSearchQuery } from '@/lib/admin/storage-image-repair';
import { buildCastandoProxyImageUrl } from '@/lib/castando-image-proxy';
import { extractCafeCoverMetadata } from '@/lib/cafe-cover-search';
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
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        {label}
      </span>
    );
  }

  if (state.phase === 'done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        ذخیره شد
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

function StatTile({
  label,
  value,
  tone = 'default',
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'sky' | 'amber';
  active?: boolean;
  onClick?: () => void;
}) {
  const tones = {
    default: active
      ? 'border-gray-900 bg-gray-900 text-white'
      : 'border-[var(--color-border-muted)] bg-[var(--color-bg)]/50 text-[var(--color-text)] hover:border-orange-300/60',
    sky: active
      ? 'border-sky-600 bg-sky-600 text-white'
      : 'border-sky-200 bg-sky-50/80 text-sky-900 hover:border-sky-300',
    amber: active
      ? 'border-amber-600 bg-amber-600 text-white'
      : 'border-amber-200 bg-amber-50/80 text-amber-900 hover:border-amber-300',
  };

  const className = `rounded-xl border px-3 py-2.5 text-center transition-colors ${tones[tone]}`;

  const content = (
    <>
      <p className="text-lg font-bold tabular-nums leading-none">{value.toLocaleString('fa-IR')}</p>
      <p className="mt-1 text-[10px] font-medium opacity-90">{label}</p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} w-full`}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
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
      <p className="text-[10px] font-semibold opacity-80">{label}</p>
      <p className="mt-1 break-all font-mono text-[11px] leading-relaxed" dir="ltr">
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
  const router = useRouter();
  const [items, setItems] = useState<StorageImageRepairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missingCount, setMissingCount] = useState(0);
  const [externalCount, setExternalCount] = useState(0);
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

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(queryInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  const fetchUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (categorySlug && categorySlug !== 'all') params.set('categorySlug', categorySlug);
    if (status !== 'all') params.set('status', status);
    if (debouncedQuery) params.set('q', debouncedQuery);
    const qs = params.toString();
    return `/api/admin/catalog/storage-image-repair${qs ? `?${qs}` : ''}`;
  }, [categorySlug, status, debouncedQuery]);

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (categorySlug !== 'all') params.set('categorySlug', categorySlug);
    if (status !== 'all') params.set('status', status);
    if (debouncedQuery) params.set('q', debouncedQuery);
    const qs = params.toString();
    router.replace(`/admin/catalog/storage-images${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [categorySlug, status, debouncedQuery, router]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(fetchUrl);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری');
      setItems((data.items || []) as StorageImageRepairRow[]);
      setMissingCount(data.missingCount || 0);
      setExternalCount(data.externalCount || 0);
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
    syncUrl();
  }, [syncUrl]);

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

  const handleMigrateAllExternal = useCallback(async () => {
    const queue = items.filter((item) => item.status === 'external');
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
  }, [items, isBatchRunning, storageReady, migrateExternal, useCastandoProxyMap]);

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

  const cafeMeta = (item: StorageImageRepairRow) => extractCafeCoverMetadata(item.metadata);

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8" dir="rtl">
      <section className="mb-5 overflow-hidden rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <div className="border-b border-[var(--color-border-muted)] bg-gradient-to-l from-orange-50/90 via-white to-white px-4 py-4 sm:px-5">
          <Link
            href="/admin/lists?view=catalog"
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:underline"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            بازگشت به مرکز محتوا
          </Link>

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 ring-1 ring-orange-200/70">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-[var(--color-text)] sm:text-xl">تصاویر</h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                موجودیت‌های بدون تصویر یا با لینک خارجی — جستجو در Google، انتخاب و ذخیره روی
                ParsPack.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-4 sm:gap-3">
          <StatTile label="در صف" value={items.length} />
          <StatTile
            label="بدون تصویر"
            value={missingCount}
            tone="sky"
            active={status === 'missing'}
            onClick={() => setStatus((s) => (s === 'missing' ? 'all' : 'missing'))}
          />
          <StatTile
            label="تصویر خارجی"
            value={externalCount}
            tone="amber"
            active={status === 'external'}
            onClick={() => setStatus((s) => (s === 'external' ? 'all' : 'external'))}
          />
        </div>
      </section>

      {!storageReady && storageError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {storageError}
        </div>
      )}

      <section className="mb-4 space-y-3 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" />
          <input
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="جستجو در عنوان…"
            className="w-full rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-bg)]/40 py-2.5 pr-9 pl-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-bg)]/40 px-3 py-2 text-sm text-[var(--color-text)] focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200/60"
          >
            <option value="all">همه دسته‌ها</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.icon || '📁'} {cat.name}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-bg)]/40 p-0.5">
            {(
              [
                ['all', 'همه'],
                ['missing', 'بدون تصویر'],
                ['external', 'خارجی'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  status === value
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {externalCount > 0 && status !== 'missing' && (
            <button
              type="button"
              onClick={() => void handleMigrateAllExternal()}
              disabled={isBatchRunning || !storageReady || loading}
              className="mr-auto inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isBatchRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              انتقال {externalCount.toLocaleString('fa-IR')} تصویر خارجی
            </button>
          )}
        </div>

        {(activeCategory || debouncedQuery) && (
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {activeCategory && (
              <span>
                دسته: {activeCategory.icon} {activeCategory.name}
              </span>
            )}
            {activeCategory && debouncedQuery && ' · '}
            {debouncedQuery && <span>جستجو: «{debouncedQuery}»</span>}
          </p>
        )}
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-orange-200/80 bg-orange-50/40 px-3 py-2.5 text-[11px] text-orange-900">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-orange-600" />
        <span>
          <strong>۱.</strong> جستجو · <strong>۲.</strong> انتخاب تصویر · <strong>۳.</strong> تأیید و
          آپلود ParsPack
        </span>
      </div>

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

      <ul className="space-y-2.5">
        {items.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const searchState = searchMap[item.id];
          const actionState = actionMap[item.id];
          const candidate = selectedCandidate[item.id];
          const isExternal = item.status === 'external';
          const currentUrl = actionState?.newUrl || item.imageUrl;
          const previewSrc =
            currentUrl && !currentUrl.includes('placeholder') ? resolvePreviewSrc(currentUrl) : '';
          const meta = cafeMeta(item);
          const isBusy =
            actionState?.phase === 'searching' ||
            actionState?.phase === 'applying' ||
            actionState?.phase === 'migrating';
          const useCastandoProxy = useCastandoProxyMap[item.id] === true;
          const proxyDownloadUrl = candidate?.link
            ? buildCastandoProxyImageUrl(candidate.link)
            : buildCastandoProxyImageUrl(item.imageUrl);

          return (
            <li
              key={item.id}
              className={`overflow-hidden rounded-2xl border bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-shadow ${
                isExpanded ? 'border-orange-200 ring-1 ring-orange-100' : 'border-[var(--color-border-muted)]'
              }`}
            >
              <div className="flex items-start gap-3 p-3 sm:p-4">
                <span className="mt-3 hidden w-5 shrink-0 text-center text-[10px] font-mono text-[var(--color-text-subtle)] sm:block">
                  {(index + 1).toLocaleString('fa-IR')}
                </span>

                <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5 sm:h-20 sm:w-20">
                  {previewSrc ? (
                    <Image src={previewSrc} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[var(--color-text-subtle)]">
                      <ImageOff className="h-6 w-6" />
                      <span className="text-[9px] font-medium">بدون تصویر</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="font-semibold text-[var(--color-text)]">{item.title}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-[var(--color-text)]">
                      {item.categoryLabel}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isExternal ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {isExternal ? 'خارجی' : 'بدون تصویر'}
                    </span>
                    <ActionStatusBadge state={actionState} />
                  </div>

                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    {item.listCount.toLocaleString('fa-IR')} جایگذاری
                    {item.host ? ` · ${item.host}` : ''}
                  </p>

                  {meta.instagram && (
                    <p className="mt-1 text-[10px] font-medium text-amber-800">
                      {displayInstagramHandle(meta.instagram)}
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {isExternal && (
                      <button
                        type="button"
                        onClick={() => void migrateExternal(item, useCastandoProxy)}
                        disabled={!storageReady || isBusy || isBatchRunning}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        {actionState?.phase === 'migrating' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        انتقال به ParsPack
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        isExpanded ? toggleDetails(item.id) : openItemSearch(item)
                      }
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      {searchState?.loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="h-3.5 w-3.5" />
                      )}
                      {isExpanded ? 'بستن جستجو' : 'جستجو و انتخاب'}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleDetails(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-muted)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      جزئیات
                    </button>

                    <Link
                      href={`/admin/catalog/${item.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
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

                  <label className="mt-3 inline-flex cursor-pointer items-start gap-2 rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-2.5 text-[11px] text-sky-950">
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
                      <span className="mt-0.5 block text-[10px] leading-relaxed text-sky-800/90">
                        فقط برای سایت‌های فیلترشده — در صورت نیاز تیک بزنید
                      </span>
                      {useCastandoProxy && (candidate?.link || item.imageUrl) && (
                        <span className="mt-1 block break-all font-mono text-[10px] text-sky-800/90" dir="ltr">
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
                            <p className="mt-0.5 truncate text-[10px] text-emerald-800/80" dir="ltr">
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
                          className="min-w-[12rem] flex-1 rounded-xl border border-[var(--color-border-muted)] bg-white px-3 py-2 text-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200/60"
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
                          <p className="mb-2 text-[11px] font-semibold text-[var(--color-text-muted)]">
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
                                    <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-0.5 text-[9px] font-mono text-white" dir="ltr">
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
    </div>
  );
}
