'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Search,
  Coffee,
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  ImageOff,
  Upload,
  ChevronDown,
  ChevronUp,
  MapPin,
  Instagram,
  Globe,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { buildCafePhotoSearchQuery } from '@/lib/cafe-cover-search';
import { displayInstagramHandle } from '@/lib/cafe-metadata';
import { toAdminStorageImageSrc } from '@/lib/liara-image-url';
import type { CafeCoverMetadata } from '@/lib/cafe-cover-search';

type CafeCoverItem = {
  id: string;
  title: string;
  order: number;
  listId: string;
  listTitle: string;
  imageUrl: string;
  status: 'missing' | 'external';
  metadata: CafeCoverMetadata;
  catalogItemId: string | null;
  isHidden: boolean;
};

type GoogleImageResult = {
  title: string;
  link: string;
  thumbnail: string;
  width: number;
  height: number;
  contextLink?: string;
};

type ItemActionPhase = 'idle' | 'searching' | 'applying' | 'migrating' | 'done' | 'error';

type ItemActionState = {
  phase: ItemActionPhase;
  newUrl?: string;
  error?: string;
};

type ItemSearchState = {
  query: string;
  results: GoogleImageResult[];
  loading: boolean;
  error: string;
};

type CafeCoverItemsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  scopeTitle: string;
  listId?: string;
  categoryId?: string;
  onUpdated?: () => void;
};

function ActionStatusBadge({ state }: { state: ItemActionState | undefined }) {
  if (!state || state.phase === 'idle') return null;

  if (state.phase === 'searching' || state.phase === 'applying' || state.phase === 'migrating') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        {state.phase === 'searching'
          ? 'در حال جستجو…'
          : state.phase === 'migrating'
            ? 'در حال تبدیل…'
            : 'در حال ذخیره…'}
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

function MetadataLinks({ metadata }: { metadata: CafeCoverMetadata }) {
  const links = [
    metadata.instagram
      ? { href: metadata.instagram, label: displayInstagramHandle(metadata.instagram), icon: Instagram }
      : null,
    metadata.mapsUrl
      ? { href: metadata.mapsUrl, label: 'نقشه', icon: MapPin }
      : null,
    metadata.website
      ? { href: metadata.website, label: 'وب‌سایت', icon: Globe }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof Instagram }>;

  if (links.length === 0 && !metadata.address) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {metadata.address && (
        <span className="inline-flex max-w-full items-center gap-1 truncate rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{metadata.address}</span>
        </span>
      )}
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-900 ring-1 ring-amber-200/70 hover:bg-amber-100"
          >
            <Icon className="h-3 w-3" />
            {link.label}
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        );
      })}
    </div>
  );
}

export default function CafeCoverItemsModal({
  isOpen,
  onClose,
  scopeTitle,
  listId,
  categoryId,
  onUpdated,
}: CafeCoverItemsModalProps) {
  const [items, setItems] = useState<CafeCoverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchMap, setSearchMap] = useState<Record<string, ItemSearchState>>({});
  const [actionMap, setActionMap] = useState<Record<string, ItemActionState>>({});
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [storageReady, setStorageReady] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [togglingHideIds, setTogglingHideIds] = useState<Set<string>>(new Set());
  const abortRef = useRef(false);

  const fetchUrl = useMemo(() => {
    if (listId) {
      return `/api/admin/items/cafe-cover-items?listId=${encodeURIComponent(listId)}`;
    }
    if (categoryId) {
      return `/api/admin/items/cafe-cover-items?categoryId=${encodeURIComponent(categoryId)}`;
    }
    return null;
  }, [listId, categoryId]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.listTitle.toLowerCase().includes(q) ||
        item.metadata.address?.toLowerCase().includes(q)
    );
  }, [items, query]);

  const allExternalCount = useMemo(
    () => items.filter((item) => item.status === 'external').length,
    [items]
  );

  const allMissingCount = useMemo(
    () => items.filter((item) => item.status === 'missing').length,
    [items]
  );

  const isBusy = isBatchRunning || togglingHideIds.size > 0;

  const handleClose = useCallback(() => {
    if (isBusy) {
      const ok = window.confirm('عملیات در حال انجام است. مطمئنید می‌خواهید ببندید؟');
      if (!ok) return;
      abortRef.current = true;
    }
    setQuery('');
    setExpandedId(null);
    setSearchMap({});
    setActionMap({});
    setIsBatchRunning(false);
    abortRef.current = false;
    onClose();
  }, [isBusy, onClose]);

  const removeItemAfterSuccess = useCallback((itemId: string) => {
    window.setTimeout(() => {
      setItems((prev) => prev.filter((row) => row.id !== itemId));
      setExpandedId((prev) => (prev === itemId ? null : prev));
      setSearchMap((prev) => {
        const next = { ...prev };
        delete next[itemId];
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
    async (item: CafeCoverItem): Promise<{ success: boolean; stopBatch?: boolean }> => {
      setActionMap((prev) => ({ ...prev, [item.id]: { phase: 'migrating' } }));

      try {
        const res = await fetch(`/api/admin/items/${item.id}/migrate-image`, { method: 'POST' });
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

        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'done', newUrl: (data.newUrl as string) || item.imageUrl },
        }));
        removeItemAfterSuccess(item.id);
        return {
          success:
            data.status === 'migrated' ||
            data.status === 'already_on_storage' ||
            data.status === 'already_liara',
        };
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

  const applyPhoto = useCallback(
    async (item: CafeCoverItem, imageUrl: string) => {
      const ok = window.confirm(`این تصویر برای «${item.title}» روی ParsPack ذخیره شود؟`);
      if (!ok) return;

      setActionMap((prev) => ({ ...prev, [item.id]: { phase: 'applying' } }));

      try {
        const res = await fetch(`/api/admin/items/${item.id}/fetch-cafe-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        });
        const data = await res.json();

        if (!res.ok) {
          const message = (data.error as string) || 'خطا در ذخیره تصویر';
          if (res.status === 503 || data.errorCode === 'storage_not_configured') {
            setStorageReady(false);
            setStorageError(message);
          }
          setActionMap((prev) => ({
            ...prev,
            [item.id]: { phase: 'error', error: message },
          }));
          return;
        }

        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'done', newUrl: (data.newUrl as string) || '' },
        }));
        removeItemAfterSuccess(item.id);
        onUpdated?.();
      } catch (err: unknown) {
        setActionMap((prev) => ({
          ...prev,
          [item.id]: { phase: 'error', error: (err as Error).message || 'خطا در ذخیره تصویر' },
        }));
      }
    },
    [removeItemAfterSuccess, onUpdated]
  );

  const runSearch = useCallback(
    async (item: CafeCoverItem, overrideQuery?: string) => {
      const defaultQuery =
        overrideQuery?.trim() ||
        searchMap[item.id]?.query ||
        buildCafePhotoSearchQuery(item.title, item.metadata, item.listTitle);

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
        const res = await fetch(`/api/admin/items/${item.id}/search-cafe-photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: defaultQuery }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error((data.error as string) || 'خطا در جستجو');
        }

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

  const toggleExpand = useCallback(
    (item: CafeCoverItem) => {
      if (item.status === 'external') return;
      setExpandedId((prev) => {
        const next = prev === item.id ? null : item.id;
        if (next === item.id && !searchMap[item.id]) {
          void runSearch(item);
        }
        return next;
      });
    },
    [runSearch, searchMap]
  );

  const handleMigrateAllExternal = useCallback(async () => {
    const queue = items.filter((item) => item.status === 'external');
    if (queue.length === 0 || isBatchRunning || !storageReady) return;

    const ok = window.confirm(
      `${queue.length.toLocaleString('fa-IR')} تصویر خارجی به ParsPack منتقل می‌شود.\n\nادامه؟`
    );
    if (!ok) return;

    abortRef.current = false;
    setIsBatchRunning(true);

    let hadWork = false;
    for (const item of queue) {
      if (abortRef.current) break;
      const result = await migrateOne(item);
      if (result.success) hadWork = true;
      if (result.stopBatch) break;
      await new Promise((r) => window.setTimeout(r, 400));
    }

    setIsBatchRunning(false);
    if (hadWork) onUpdated?.();
  }, [items, isBatchRunning, storageReady, migrateOne, onUpdated]);

  const toggleItemHidden = async (item: CafeCoverItem) => {
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
      if (!res.ok || !data.success) throw new Error(data.error || 'خطا');

      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isHidden: !item.isHidden } : row))
      );
      onUpdated?.();
    } catch (err: unknown) {
      alert((err as Error).message || 'خطا');
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
    if (!isOpen || !fetchUrl) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setItems([]);
    setExpandedId(null);
    setSearchMap({});
    setActionMap({});

    void fetch(fetchUrl)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در بارگذاری');
        if (!cancelled) {
          setItems((data.items || []) as CafeCoverItem[]);
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
  }, [isOpen, fetchUrl]);

  if (!isOpen || !mounted) return null;

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
        <div className="relative shrink-0 border-b border-gray-100 bg-gradient-to-l from-orange-50/80 via-white to-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 ring-1 ring-orange-200/70">
              <Coffee className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  تصویر کافه/رستوران — ParsPack
                </h2>
                {!loading && items.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-900">
                    {items.length.toLocaleString('fa-IR')}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-gray-700">{scopeTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                برای هر آیتم تصویر را از Google جستجو کنید، یکی را انتخاب کنید و روی ParsPack ذخیره
                کنید. تصاویر خارجی موجود را هم می‌توانید گروهی منتقل کنید.
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
        </div>

        {!storageReady && storageError && (
          <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            {storageError}
          </div>
        )}

        <div className="shrink-0 border-b border-gray-100 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو در عنوان، لیست یا آدرس…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200/60"
            />
          </div>
          {!loading && items.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span>
                {allMissingCount.toLocaleString('fa-IR')} بدون تصویر ·{' '}
                {allExternalCount.toLocaleString('fa-IR')} خارجی
              </span>
              {allExternalCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMigrateAllExternal()}
                  disabled={isBusy || !storageReady}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <Upload className="h-3 w-3" />
                  تبدیل {allExternalCount.toLocaleString('fa-IR')} تصویر خارجی
                </button>
              )}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {loading && (
            <div className="flex items-center justify-center py-16 text-sm text-gray-500">
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              در حال بارگذاری…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
              همه آیتم‌ها تصویر ParsPack دارند.
            </div>
          )}

          {!loading && filteredItems.length === 0 && items.length > 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
              نتیجه‌ای برای «{query}» پیدا نشد.
            </div>
          )}

          <ul className="space-y-2">
            {filteredItems.map((item, index) => {
              const actionState = actionMap[item.id];
              const searchState = searchMap[item.id];
              const isExpanded = expandedId === item.id;
              const isExternal = item.status === 'external';
              const displayUrl = actionState?.newUrl || item.imageUrl;
              const imageSrc =
                displayUrl && !displayUrl.includes('placeholder')
                  ? displayUrl.startsWith('http') && displayUrl.includes('parspack')
                    ? toAdminStorageImageSrc(displayUrl)
                    : displayUrl
                  : '';

              return (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex items-start gap-3 px-3 py-2.5">
                    <span className="mt-2 text-[10px] font-mono text-gray-300">
                      {(index + 1).toLocaleString('fa-IR')}
                    </span>

                    <div className="relative mt-0.5 h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
                      {imageSrc ? (
                        <Image src={imageSrc} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isExternal
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {isExternal ? 'خارجی' : 'بدون تصویر'}
                        </span>
                        <ActionStatusBadge state={actionState} />
                      </div>
                      {categoryId && (
                        <p className="mt-0.5 truncate text-[11px] text-violet-600">
                          {item.listTitle}
                        </p>
                      )}
                      <MetadataLinks metadata={item.metadata} />
                    </div>

                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => void toggleItemHidden(item)}
                        disabled={togglingHideIds.has(item.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title={item.isHidden ? 'نمایش' : 'مخفی'}
                      >
                        {item.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {isExternal ? (
                        <button
                          type="button"
                          onClick={() => void migrateOne(item)}
                          disabled={isBusy || !storageReady}
                          className="rounded-lg bg-amber-600 p-1.5 text-white hover:bg-amber-700 disabled:opacity-50"
                          title="تبدیل به ParsPack"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item)}
                          className="rounded-lg p-1.5 text-orange-700 hover:bg-orange-50"
                          title="جستجوی تصویر"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <Link
                        href={`/admin/items/${item.id}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="ویرایش"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {isExpanded && !isExternal && (
                    <div className="border-t border-gray-100 bg-orange-50/40 px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={searchState?.query || buildCafePhotoSearchQuery(item.title, item.metadata, item.listTitle)}
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
                          className="min-w-[12rem] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void runSearch(
                              item,
                              searchMap[item.id]?.query ||
                                buildCafePhotoSearchQuery(item.title, item.metadata, item.listTitle)
                            )
                          }
                          disabled={searchState?.loading || isBusy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                          {searchState?.loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Search className="h-3.5 w-3.5" />
                          )}
                          جستجو
                        </button>
                      </div>

                      {searchState?.error && (
                        <p className="mt-2 text-xs text-red-600">{searchState.error}</p>
                      )}

                      {searchState?.results && searchState.results.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {searchState.results.map((result) => (
                            <button
                              key={result.link}
                              type="button"
                              onClick={() => void applyPhoto(item, result.link)}
                              disabled={isBusy || !storageReady}
                              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-orange-400 hover:ring-2 hover:ring-orange-200 disabled:opacity-50"
                              title={result.title}
                            >
                              <Image
                                src={result.thumbnail || result.link}
                                alt={result.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                unoptimized
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {actionState?.phase === 'error' && (
                        <button
                          type="button"
                          onClick={() => void runSearch(item)}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                        >
                          <RotateCcw className="h-3 w-3" />
                          تلاش مجدد
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 px-4 py-3 text-[11px] text-gray-500">
          {items.length.toLocaleString('fa-IR')} آیتم نیازمند تصویر ParsPack
        </div>
      </div>
    </div>,
    document.body
  );
}
