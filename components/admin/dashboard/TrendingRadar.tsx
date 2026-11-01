'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronUp,
  ChevronDown,
  Info,
  Search,
  Pencil,
  Bug,
  ExternalLink,
  TrendingUp,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import Badge from '@/components/admin/design-system/Badge';
import type { TrendingRadarRow as TrendingRadarRowType } from '@/lib/admin/types';

type SortKey =
  | 'listName'
  | 'category'
  | 'viewCount'
  | 'saves24h'
  | 'growth7dPercent'
  | 'trendingScore';

type TrendFilter = 'all' | 'rising' | 'falling' | 'active24h';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

const CATEGORY_STYLES: Record<string, string> = {
  کتاب: 'bg-amber-500/12 text-amber-800 border-amber-200/80',
  'فیلم و سریال': 'bg-indigo-500/12 text-indigo-800 border-indigo-200/80',
  'کافه و رستوران': 'bg-emerald-500/12 text-emerald-800 border-emerald-200/80',
  فیلم: 'bg-indigo-500/12 text-indigo-800 border-indigo-200/80',
  کافه: 'bg-emerald-500/12 text-emerald-800 border-emerald-200/80',
  پادکست: 'bg-pink-500/12 text-pink-800 border-pink-200/80',
};

const TREND_FILTERS: { key: TrendFilter; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'rising', label: 'در حال رشد' },
  { key: 'falling', label: 'در افت' },
  { key: 'active24h', label: 'فعال ۲۴h' },
];

function formatCount(n: number): string {
  if (n <= 0) return '—';
  return n.toLocaleString('fa-IR');
}

function formatSaveCell(saves24h: number, saveCount: number): {
  text: string;
  hint: string | null;
  muted: boolean;
} {
  if (saves24h > 0) {
    return { text: saves24h.toLocaleString('fa-IR'), hint: '۲۴h', muted: false };
  }
  if (saveCount > 0) {
    return { text: saveCount.toLocaleString('fa-IR'), hint: 'کل', muted: true };
  }
  return { text: '۰', hint: null, muted: true };
}

function CategoryChip({ name }: { name: string }) {
  const style =
    CATEGORY_STYLES[name] ??
    'bg-(--color-bg) text-wibe-secondary border-(--color-border)';
  return (
    <span
      className={`inline-flex max-w-35 truncate rounded-md border px-2 py-0.5 text-xs font-medium ${style}`}
      title={name}
    >
      {name}
    </span>
  );
}

function TrendStatusBadge({ trend }: { trend: TrendingRadarRowType['trend'] }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 text-emerald-700 border border-emerald-200/70 px-2 py-0.5 text-xs font-medium">
        <ArrowUp className="w-3.5 h-3.5" />
        رشد
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/12 text-red-700 border border-red-200/70 px-2 py-0.5 text-xs font-medium">
        <ArrowDown className="w-3.5 h-3.5" />
        افت
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 text-wibe-secondary border border-gray-200/80 px-2 py-0.5 text-xs font-medium">
      <Minus className="w-3.5 h-3.5" />
      ثابت
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped >= 60 ? 'bg-emerald-500' : clamped >= 30 ? 'bg-amber-500' : 'bg-slate-300';
  return (
    <div className="flex items-center gap-2 min-w-25">
      <div className="flex-1 h-1.5 rounded-full bg-(--color-bg) overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="tabular-nums text-sm font-semibold text-(--color-text) w-8 text-left">
        {clamped.toLocaleString('fa-IR')}
      </span>
    </div>
  );
}

interface TrendingRadarProps {
  rows: TrendingRadarRowType[];
}

export default function TrendingRadar({ rows }: TrendingRadarProps) {
  const [sortKey, setSortKey] = useState<SortKey>('trendingScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [popoverId, setPopoverId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverId) return;
    const close = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverId(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [popoverId]);

  const stats = useMemo(() => {
    const rising = rows.filter((r) => r.trend === 'up').length;
    const active24h = rows.filter((r) => r.saves24h > 0).length;
    return { total: rows.length, rising, active24h };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (q) {
        const hay = `${row.listName} ${row.category} ${row.listSlug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (trendFilter === 'rising') return row.trend === 'up';
      if (trendFilter === 'falling') return row.trend === 'down';
      if (trendFilter === 'active24h') return row.saves24h > 0;
      return true;
    });
  }, [rows, search, trendFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'fa');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalFiltered = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, trendFilter, pageSize, sortKey, sortDir]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const rangeStart = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalFiltered);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'listName' || key === 'category' ? 'asc' : 'desc');
    }
  };

  const Th = ({
    label,
    keyName,
    align = 'right',
    className = '',
  }: {
    label: string;
    keyName: SortKey;
    align?: 'right' | 'center';
    className?: string;
  }) => (
    <th
      scope="col"
      aria-sort={
        sortKey === keyName
          ? sortDir === 'desc'
            ? 'descending'
            : 'ascending'
          : 'none'
      }
      className={`px-3 py-2.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => toggleSort(keyName)}
        className={`flex items-center gap-1 w-full font-semibold text-xs text-wibe-secondary hover:text-(--color-text) transition-colors ${
          align === 'center' ? 'justify-center' : 'justify-end'
        }`}
      >
        {label}
        {sortKey === keyName ? (
          sortDir === 'desc' ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          )
        ) : (
          <span className="w-3.5" />
        )}
      </button>
    </th>
  );

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-card) overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-(--color-border) space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-(--color-text)">
                رادار ترند
              </h2>
            </div>
            <p className="text-xs text-wibe-secondary mt-1">
              لیست‌های پربازدید بر اساس بازدید، ذخیره ۲۴ ساعت، رشد ۷ روز و امتیاز ترکیبی
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="neutral">{stats.total.toLocaleString('fa-IR')} لیست</Badge>
            <Badge variant="success">
              {stats.rising.toLocaleString('fa-IR')} در رشد
            </Badge>
            <Badge variant="trending">
              {stats.active24h.toLocaleString('fa-IR')} فعال ۲۴h
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-subtle)" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در نام لیست یا دسته..."
              className="w-full pr-9 pl-3 py-2 text-sm rounded-xl border border-(--color-border) bg-(--color-bg) focus:outline-none focus:ring-2 focus:ring-(--primary)/30"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-(--color-bg) border border-(--color-border) overflow-x-auto">
            <Filter className="w-4 h-4 text-(--color-text-subtle) shrink-0 mx-1 hidden sm:block" />
            {TREND_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setTrendFilter(f.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  trendFilter === f.key
                    ? 'bg-(--color-surface) text-(--color-text) shadow-sm'
                    : 'text-wibe-secondary hover:text-(--color-text)'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-200 text-sm">
          <thead className="bg-(--color-bg)/80 sticky top-0 z-10 border-b border-(--color-border)">
            <tr>
              <Th label="لیست" keyName="listName" className="pr-4 min-w-45" />
              <Th label="دسته" keyName="category" className="w-32.5" />
              <Th
                label="بازدید"
                keyName="viewCount"
                align="center"
                className="w-20"
              />
              <Th
                label="ذخیره"
                keyName="saves24h"
                align="center"
                className="w-24"
              />
              <Th
                label="رشد ۷ روز"
                keyName="growth7dPercent"
                align="center"
                className="w-24"
              />
              <Th
                label="امتیاز"
                keyName="trendingScore"
                className="w-35"
              />
              <th scope="col" className="px-3 py-2.5 text-center text-xs font-semibold text-wibe-secondary w-22">
                وضعیت
              </th>
              <th scope="col" className="pl-4 pr-3 py-2.5 text-center text-xs font-semibold text-wibe-secondary w-27">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border-muted)">
            {paginated.map((row, idx) => (
              <tr
                key={row.id}
                className={`transition-colors hover:bg-(--color-bg)/80 ${
                  row.trend === 'up'
                    ? 'bg-emerald-500/[0.04]'
                    : idx % 2 === 1
                      ? 'bg-(--color-bg)/30'
                      : ''
                }`}
              >
                <td className="pr-4 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/lists/${row.id}/edit`}
                      className="font-medium text-(--color-text) hover:text-primary line-clamp-1"
                      title={`${row.listName}${row.listSlug ? `\n/${row.listSlug}` : ''}`}
                    >
                      {row.listName}
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <CategoryChip name={row.category} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`tabular-nums font-medium ${
                      row.viewCount > 0
                        ? 'text-(--color-text)'
                        : 'text-(--color-text-subtle)'
                    }`}
                  >
                    {formatCount(row.viewCount)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  {(() => {
                    const save = formatSaveCell(row.saves24h, row.saveCount);
                    return (
                      <span
                        className={`inline-flex flex-col items-center tabular-nums font-medium ${
                          save.muted
                            ? 'text-(--color-text-subtle)'
                            : 'text-(--color-text)'
                        }`}
                        title={
                          save.hint === 'کل'
                            ? 'ذخیره کل — فعالیت ۲۴ ساعت اخیر ندارد'
                            : save.hint === '۲۴h'
                              ? 'ذخیره در ۲۴ ساعت اخیر'
                              : undefined
                        }
                      >
                        <span>{save.text}</span>
                        {save.hint ? (
                          <span className="text-[10px] font-normal text-(--color-text-subtle)">
                            {save.hint}
                          </span>
                        ) : null}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`tabular-nums font-semibold text-sm ${
                      row.growth7dPercent > 2
                        ? 'text-emerald-600'
                        : row.growth7dPercent < -2
                          ? 'text-red-600'
                          : 'text-wibe-secondary'
                    }`}
                  >
                    {row.growth7dPercent > 2 ? '+' : ''}
                    {row.growth7dPercent.toLocaleString('fa-IR')}٪
                  </span>
                </td>
                <td className="px-3 py-2.5 relative">
                  <div
                    className="flex items-center gap-1"
                    ref={popoverId === row.id ? popoverRef : undefined}
                  >
                    <ScoreBar score={row.trendingScore} />
                    {row.scoreBreakdown && row.scoreBreakdown.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPopoverId(popoverId === row.id ? null : row.id)
                          }
                          className="p-1 rounded-md hover:bg-(--color-bg) text-(--color-text-subtle)"
                          aria-label="جزئیات امتیاز"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        {popoverId === row.id && (
                          <div className="absolute z-30 mt-1 min-w-42 rounded-xl bg-gray-900 text-white text-xs p-3 shadow-xl left-4 top-full">
                            <p className="font-medium mb-2 text-gray-200">ترکیب امتیاز</p>
                            {row.scoreBreakdown.map((b, i) => (
                              <div
                                key={i}
                                className="flex justify-between gap-4 py-0.5"
                              >
                                <span className="text-(--color-text-subtle)">{b.label}</span>
                                <span className="tabular-nums">
                                  {b.value.toLocaleString('fa-IR')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <TrendStatusBadge trend={row.trend} />
                </td>
                <td className="pl-4 pr-3 py-2.5">
                  <div className="flex items-center justify-center gap-0.5">
                    <Link
                      href={`/lists/${row.listSlug}`}
                      target="_blank"
                      className="p-2 rounded-lg text-wibe-secondary hover:bg-(--color-bg) hover:text-primary transition-colors"
                      title="مشاهده در سایت"
                      aria-label="مشاهده در سایت"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/lists/${row.id}/edit`}
                      className="p-2 rounded-lg text-wibe-secondary hover:bg-(--color-bg) hover:text-primary transition-colors"
                      title="ویرایش"
                      aria-label="ویرایش لیست"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/lists/${row.id}/debug`}
                      className="p-2 rounded-lg text-wibe-secondary hover:bg-amber-500/10 hover:text-amber-700 transition-colors"
                      title="دیباگ ترند"
                      aria-label="دیباگ ترند"
                    >
                      <Bug className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalFiltered === 0 ? (
        <div className="py-14 text-center px-4">
          <p className="text-sm text-wibe-secondary">
            {rows.length === 0
              ? 'لیستی برای نمایش وجود ندارد.'
              : 'با این فیلتر یا جستجو نتیجه‌ای نیست.'}
          </p>
          {(search || trendFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setTrendFilter('all');
              }}
              className="mt-3 text-sm text-primary hover:underline"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-(--color-border) bg-(--color-bg)/40">
          <div className="flex items-center gap-2 text-sm text-wibe-secondary">
            <label htmlFor="trending-page-size" className="shrink-0">
              تعداد در صفحه:
            </label>
            <select
              id="trending-page-size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
              className="rounded-lg border border-(--color-border) bg-(--color-surface) px-2.5 py-1.5 text-sm text-(--color-text) focus:outline-none focus:ring-2 focus:ring-(--primary)/30"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString('fa-IR')}
                </option>
              ))}
            </select>
            <span className="hidden sm:inline text-xs">
              نمایش {rangeStart.toLocaleString('fa-IR')}–{rangeEnd.toLocaleString('fa-IR')} از{' '}
              {totalFiltered.toLocaleString('fa-IR')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm font-medium text-(--color-text) disabled:opacity-40 disabled:cursor-not-allowed hover:bg-(--color-bg) transition-colors"
            >
              قبلی
            </button>
            <span className="text-sm text-wibe-secondary tabular-nums min-w-22 text-center">
              صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm font-medium text-(--color-text) disabled:opacity-40 disabled:cursor-not-allowed hover:bg-(--color-bg) transition-colors"
            >
              بعدی
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
