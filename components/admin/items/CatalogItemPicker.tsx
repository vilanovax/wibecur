'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { catalogCategoryLabel } from '@/lib/catalog-display';
import { Search, Loader2, Check, Library, ArrowLeft } from 'lucide-react';

export type CatalogSearchHit = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  categorySlug: string | null;
  listCount: number;
  sampleListTitles: string[];
  alreadyInList: boolean;
};

interface CatalogItemPickerProps {
  listId: string;
  categorySlug?: string | null;
  /** اگر false، انتخابگر لیست در همین کامپوننت نمایش داده می‌شود */
  showListSelector?: boolean;
  lists?: { id: string; title: string; icon?: string | null }[];
  onListChange?: (listId: string) => void;
  onAdded?: () => void;
}

export default function CatalogItemPicker({
  listId,
  categorySlug,
  showListSelector = false,
  lists = [],
  onListChange,
  onAdded,
}: CatalogItemPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogSearchHit[]>([]);
  const [recent, setRecent] = useState<CatalogSearchHit[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const params = new URLSearchParams({ listId });
      if (categorySlug) params.set('categorySlug', categorySlug);
      const res = await fetch(`/api/admin/catalog-items/recent?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      setRecent(data.items ?? []);
    } catch {
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  }, [listId, categorySlug]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      setMessage('');
      try {
        const params = new URLSearchParams({ q: q.trim(), listId });
        if (categorySlug) params.set('categorySlug', categorySlug);
        const res = await fetch(`/api/admin/catalog-items/search?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در جستجو');
        setResults(data.items ?? []);
      } catch (e: unknown) {
        setMessage(e instanceof Error ? e.message : 'خطا در جستجو');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [listId, categorySlug]
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 350);
    return () => clearTimeout(t);
  }, [query, search]);

  const handleAdd = async (hit: CatalogSearchHit) => {
    if (hit.alreadyInList) return;
    setAddingId(hit.id);
    setMessage('');
    try {
      const res = await fetch('/api/admin/items/add-to-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogItemId: hit.id, listId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در افزودن');
      setMessage(`«${hit.title}» به لیست اضافه شد`);
      const markAdded = (r: CatalogSearchHit) =>
        r.id === hit.id ? { ...r, alreadyInList: true } : r;
      setResults((prev) => prev.map(markAdded));
      setRecent((prev) => prev.map(markAdded));
      onAdded?.();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'خطا');
    } finally {
      setAddingId(null);
    }
  };

  const queryReady = query.trim().length >= 2;

  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/50 to-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-violet-100/80 bg-white/60">
        <p className="text-sm text-gray-600 leading-relaxed">
          آیتمی که قبلاً در وایب ثبت شده را پیدا کنید و فقط به لیست مقصد وصل کنید —{' '}
          <strong className="text-gray-800">بدون کپی</strong> عنوان و تصویر.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {showListSelector && lists.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              لیست مقصد
            </label>
            <select
              value={listId}
              onChange={(e) => onListChange?.(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.icon || '📋'} {l.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="نام فیلم، کتاب، کافه… (حداقل ۲ حرف)"
            className="w-full pr-10 pl-10 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-violet-600" />
          )}
        </div>

        {message && (
          <p
            role="status"
            className={`text-sm rounded-xl px-3 py-2.5 ${
              message.includes('اضافه شد')
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                : 'bg-red-50 text-red-800 border border-red-100'
            }`}
          >
            {message}
          </p>
        )}

        <div className="min-h-[200px] rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
          {!queryReady && (
            <>
              {recentLoading ? (
                <div className="p-4 space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-200/80 rounded-lg" />
                  ))}
                </div>
              ) : recent.length > 0 ? (
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-500 px-2 py-2">اخیراً به‌روز شده</p>
                  <ul className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {recent.map((hit) => (
                      <li
                        key={hit.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
                      >
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-200 shrink-0 ring-1 ring-black/5">
                          <ImageWithFallback
                            src={hit.imageUrl ?? ''}
                            alt=""
                            className="w-full h-full object-cover"
                            fallbackIcon="📋"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-sm font-semibold text-gray-900 truncate">{hit.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {catalogCategoryLabel(hit.categorySlug)}
                            {hit.listCount > 0 && (
                              <span> · در {hit.listCount.toLocaleString('fa-IR')} لیست</span>
                            )}
                          </p>
                        </div>
                        {hit.alreadyInList ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                            <Check className="w-3.5 h-3.5" />
                            موجود
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={addingId === hit.id}
                            onClick={() => handleAdd(hit)}
                            className="shrink-0 text-xs font-bold px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 shadow-sm"
                          >
                            {addingId === hit.id ? '…' : 'افزودن'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center px-6 py-10 gap-3">
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                    <Search className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="text-sm text-gray-600 max-w-xs">
                    عنوان آیتم را تایپ کنید (حداقل ۲ حرف) یا از{' '}
                    <Link href="/admin/catalog" className="text-violet-600 font-semibold hover:underline">
                      کاتالوگ
                    </Link>{' '}
                    مرور کنید
                  </p>
                </div>
              )}
            </>
          )}

          {queryReady && !loading && results.length === 0 && (
            <p className="text-sm text-center text-gray-500 py-12 px-4">
              نتیجه‌ای یافت نشد. می‌توانید از تب «آیتم جدید» یک موجودیت تازه بسازید.
            </p>
          )}

          {queryReady && results.length > 0 && (
            <ul className="divide-y divide-gray-100 max-h-[340px] overflow-y-auto p-1">
              {results.map((hit) => (
                <li
                  key={hit.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
                >
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-200 shrink-0 ring-1 ring-black/5">
                    <ImageWithFallback
                      src={hit.imageUrl ?? ''}
                      alt=""
                      className="w-full h-full object-cover"
                      fallbackIcon="📋"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-semibold text-gray-900 truncate">{hit.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {catalogCategoryLabel(hit.categorySlug)}
                      {hit.listCount > 0 && (
                        <span> · در {hit.listCount.toLocaleString('fa-IR')} لیست</span>
                      )}
                    </p>
                    {hit.sampleListTitles[0] && (
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        مثلاً: {hit.sampleListTitles[0]}
                      </p>
                    )}
                  </div>
                  {hit.alreadyInList ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      موجود
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={addingId === hit.id}
                      onClick={() => handleAdd(hit)}
                      className="shrink-0 text-xs font-bold px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 shadow-sm"
                    >
                      {addingId === hit.id ? '…' : 'افزودن'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900"
        >
          <Library className="w-3.5 h-3.5" />
          مرور همهٔ کاتالوگ
          <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
        </Link>
      </div>
    </div>
  );
}
