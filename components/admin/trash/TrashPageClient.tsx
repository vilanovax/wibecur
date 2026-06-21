'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import {
  ArchiveRestore,
  CheckSquare,
  ExternalLink,
  FolderOpen,
  List,
  Loader2,
  Package,
  Search,
  Square,
  Trash2,
  User,
} from 'lucide-react';
import type {
  TrashCategoryRow,
  TrashCounts,
  TrashEntity,
  TrashItemRow,
  TrashListRow,
} from '@/lib/admin/trash-hub';
import TrashBulkBar from './TrashBulkBar';

type TrashRow = TrashListRow | TrashCategoryRow | TrashItemRow;

const TABS: { id: TrashEntity; label: string; icon: typeof List }[] = [
  { id: 'lists', label: 'لیست‌ها', icon: List },
  { id: 'categories', label: 'دسته‌ها', icon: FolderOpen },
  { id: 'items', label: 'آیتم‌ها', icon: Package },
];

function formatDeletedAt(iso: string) {
  const date = new Date(iso);
  return {
    absolute: date.toLocaleDateString('fa-IR', { dateStyle: 'medium' }),
    relative: formatDistanceToNow(date, { addSuffix: true, locale: faIR }),
  };
}

function actorLabel(row: TrashRow) {
  const actor = row.deletedBy;
  if (!actor) return '—';
  return actor.name || actor.email || '—';
}

function rowTitle(row: TrashRow, tab: TrashEntity): string {
  if (tab === 'lists') return (row as TrashListRow).title;
  if (tab === 'categories') return (row as TrashCategoryRow).name;
  return (row as TrashItemRow).title;
}

function rowEditHref(row: TrashRow, tab: TrashEntity): string | null {
  if (tab === 'lists') return `/admin/lists/${row.id}/edit`;
  if (tab === 'categories') return `/admin/categories/${row.id}/edit`;
  return `/admin/items/${row.id}/edit`;
}

function matchesSearch(row: TrashRow, tab: TrashEntity, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const title = rowTitle(row, tab).toLowerCase();
  if (title.includes(q)) return true;
  if (tab === 'lists') {
    const r = row as TrashListRow;
    return r.slug.toLowerCase().includes(q);
  }
  if (tab === 'categories') {
    const r = row as TrashCategoryRow;
    return r.slug.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
  }
  const r = row as TrashItemRow;
  return (r.list?.title.toLowerCase().includes(q) ?? false) || (r.list?.slug.toLowerCase().includes(q) ?? false);
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
      {children}
    </span>
  );
}

function RowMeta({ row, tab }: { row: TrashRow; tab: TrashEntity }) {
  if (tab === 'lists') {
    const r = row as TrashListRow;
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <MetaChip>{r.itemCount.toLocaleString('fa-IR')} آیتم</MetaChip>
        <MetaChip>{r.saveCount.toLocaleString('fa-IR')} ذخیره</MetaChip>
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate max-w-[180px]" dir="ltr">
          {r.slug}
        </span>
      </div>
    );
  }
  if (tab === 'categories') {
    const r = row as TrashCategoryRow;
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <span className="text-base">{r.icon || '📁'}</span>
        <MetaChip>{r.listCount.toLocaleString('fa-IR')} لیست</MetaChip>
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500" dir="ltr">
          {r.slug}
        </span>
      </div>
    );
  }
  const r = row as TrashItemRow;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      {r.list ? (
        <MetaChip>لیست: {r.list.title}</MetaChip>
      ) : (
        <MetaChip>بدون لیست</MetaChip>
      )}
    </div>
  );
}

type Props = {
  initialTab: TrashEntity;
  initialCounts: TrashCounts;
  initialItems: TrashRow[];
};

export default function TrashPageClient({ initialTab, initialCounts, initialItems }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TrashEntity>(initialTab);
  const [counts, setCounts] = useState(initialCounts);
  const [items, setItems] = useState<TrashRow[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionId, setActionId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');

  const loadTab = useCallback(async (nextTab: TrashEntity) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/trash?tab=${nextTab}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا در بارگذاری');
      setCounts(json.counts);
      setItems(json.items ?? []);
      setSelected(new Set());
      setSearch('');
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'خطا', tone: 'error' });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchTab = (nextTab: TrashEntity) => {
    setTab(nextTab);
    setSelected(new Set());
    setSearch('');
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', nextTab);
    router.replace(`/admin/trash?${params.toString()}`, { scroll: false });
    loadTab(nextTab);
  };

  useEffect(() => {
    if (tab !== initialTab) return;
    setItems(initialItems);
    setCounts(initialCounts);
  }, [initialTab, initialCounts, initialItems, tab]);

  const filteredItems = useMemo(
    () => items.filter((row) => matchesSearch(row, tab, search)),
    [items, tab, search]
  );

  const allSelected =
    filteredItems.length > 0 && filteredItems.every((row) => selected.has(row.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const refreshCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/trash?countsOnly=1');
      const json = await res.json();
      if (json.success && json.counts) setCounts(json.counts);
    } catch {
      // ignore
    }
  }, []);

  const restoreOne = async (id: string, title: string) => {
    if (!window.confirm(`بازگردانی «${title}» از زباله‌دان؟`)) return;
    setActionId(id);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/trash/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: tab, action: 'restore', ids: [id] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در بازگردانی');
      setMessage({ text: data.message || `«${title}» بازگردانی شد`, tone: 'success' });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadTab(tab);
      await refreshCounts();
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'خطا', tone: 'error' });
    } finally {
      setActionId(null);
    }
  };

  const restoreBulk = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(`بازگردانی ${ids.length.toLocaleString('fa-IR')} مورد انتخاب‌شده؟`)) return;
    setBulkLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/trash/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: tab, action: 'restore', ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در بازگردانی گروهی');
      setMessage({ text: data.message || 'بازگردانی انجام شد', tone: 'success' });
      setSelected(new Set());
      await loadTab(tab);
      await refreshCounts();
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'خطا', tone: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const tabLabel = TABS.find((t) => t.id === tab)?.label ?? '';

  return (
    <div className="space-y-5 pb-24" dir="rtl">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-gradient-to-l from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-800 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">زباله‌دان</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  بازگردانی تکی یا گروهی — حذف دائمی از اینجا انجام نمی‌شود
                </p>
              </div>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 dark:text-gray-400">مجموع</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {counts.total.toLocaleString('fa-IR')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const count = counts[t.id];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className={`rounded-xl border p-3 text-right transition-all ${
                  active
                    ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-violet-600' : 'text-gray-400'}`} />
                  <span className={`text-lg font-bold tabular-nums ${active ? 'text-violet-700 dark:text-violet-200' : 'text-gray-900 dark:text-white'}`}>
                    {count.toLocaleString('fa-IR')}
                  </span>
                </div>
                <p className={`mt-1 text-xs font-medium ${active ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {t.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`جستجو در ${tabLabel}…`}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 pr-10 pl-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
        {filteredItems.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0"
          >
            {allSelected ? <CheckSquare className="h-4 w-4 text-violet-600" /> : <Square className="h-4 w-4" />}
            {allSelected ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            در حال بارگذاری…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-400">
              <Trash2 className="h-7 w-7" />
            </span>
            <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              {search.trim()
                ? 'نتیجه‌ای یافت نشد'
                : counts[tab] === 0
                  ? `زباله‌دان ${tabLabel} خالی است`
                  : 'موردی برای نمایش نیست'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {search.trim()
                ? 'عبارت جستجو را تغییر دهید'
                : 'موارد حذف‌شده اینجا نمایش داده می‌شوند و قابل بازگردانی هستند'}
            </p>
          </div>
        ) : (
          <>
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/20 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              نمایش {filteredItems.length.toLocaleString('fa-IR')} از {items.length.toLocaleString('fa-IR')} مورد
              {!someSelected && ' · برای بازگردانی گروهی، چند مورد را انتخاب کنید'}
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredItems.map((row) => {
                const title = rowTitle(row, tab);
                const isSelected = selected.has(row.id);
                const editHref = rowEditHref(row, tab);
                const deleted = formatDeletedAt(row.deletedAt);
                return (
                  <li
                    key={row.id}
                    className={`group flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 transition-colors ${
                      isSelected
                        ? 'bg-violet-50/70 dark:bg-violet-900/15'
                        : 'hover:bg-gray-50/80 dark:hover:bg-gray-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleOne(row.id)}
                        aria-label={`انتخاب ${title}`}
                        className="mt-0.5 shrink-0 text-gray-400 hover:text-violet-600 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-violet-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white leading-snug">{title}</p>
                        <RowMeta row={row} tab={tab} />
                        {row.deleteReason && (
                          <p className="mt-1.5 text-xs text-amber-700/90 dark:text-amber-300/90 line-clamp-2">
                            {row.deleteReason}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {actorLabel(row)}
                          </span>
                          <span title={deleted.absolute}>{deleted.relative}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:shrink-0 ps-8 sm:ps-0">
                      {editHref && (
                        <Link
                          href={editHref}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          مشاهده
                        </Link>
                      )}
                      <button
                        type="button"
                        disabled={actionId === row.id || bulkLoading}
                        onClick={() => restoreOne(row.id, title)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                      >
                        {actionId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        )}
                        بازگردانی
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <TrashBulkBar
        selectedCount={selected.size}
        onRestore={restoreBulk}
        onClear={() => setSelected(new Set())}
        loading={bulkLoading}
      />
    </div>
  );
}
