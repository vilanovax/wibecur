'use client';

import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, ChevronUp, ChevronDown, Info } from 'lucide-react';
import Link from 'next/link';
import type { TrendingRadarRow as TrendingRadarRowType } from '@/lib/admin/types';

type SortKey = 'listName' | 'category' | 'saves24h' | 'growth7dPercent' | 'trendingScore';

interface TrendingRadarProps {
  rows: TrendingRadarRowType[];
}

export default function TrendingRadar({ rows }: TrendingRadarProps) {
  const [sortKey, setSortKey] = useState<SortKey>('trendingScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [popoverId, setPopoverId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let va: number | string = (a as Record<SortKey, unknown>)[sortKey] as number | string;
      let vb: number | string = (b as Record<SortKey, unknown>)[sortKey] as number | string;
      if (typeof va === 'string') va = va || '';
      if (typeof vb === 'string') vb = vb || '';
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const Th = ({
    label,
    keyName,
    className = '',
  }: {
    label: string;
    keyName: SortKey;
    className?: string;
  }) => (
    <th className={className}>
      <button
        type="button"
        onClick={() => toggleSort(keyName)}
        className="flex items-center gap-1 w-full text-right font-semibold text-[var(--color-text-muted)] text-sm hover:text-[var(--color-text)] transition-colors py-2"
      >
        {label}
        {sortKey === keyName ? (
          sortDir === 'desc' ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )
        ) : null}
      </button>
    </th>
  );

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          رادار ترند — لیست‌های در حال رشد
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          مرتب‌سازی با کلیک روی هدر ستون
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-[var(--color-bg)] sticky top-0 z-10">
            <tr className="border-b border-[var(--color-border)]">
              <Th label="لیست" keyName="listName" className="pr-4 py-3 text-right" />
              <Th label="دسته" keyName="category" className="pr-4" />
              <Th label="ذخیره ۲۴h" keyName="saves24h" className="pr-4" />
              <Th label="رشد ۷ روز ٪" keyName="growth7dPercent" className="pr-4" />
              <Th label="امتیاز ترند" keyName="trendingScore" className="pr-4" />
              <th className="pr-4 py-3 text-right text-sm font-semibold text-[var(--color-text-muted)] w-16">
                وضعیت
              </th>
              <th className="pr-4 py-3 text-right text-sm font-semibold text-[var(--color-text-muted)]">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-[var(--color-border-muted)] transition-colors hover:bg-[var(--color-bg)] ${
                  row.trend === 'up' ? 'bg-emerald-50/30' : ''
                }`}
              >
                <td className="pr-4 py-3">
                  <Link
                    href={`/admin/lists/${row.id}/edit`}
                    className="font-medium text-[var(--color-text)] hover:text-[var(--primary)]"
                  >
                    {row.listName}
                  </Link>
                </td>
                <td className="pr-4 py-3 text-sm text-[var(--color-text-muted)]">
                  {row.category}
                </td>
                <td className="pr-4 py-3 text-sm tabular-nums">
                  {row.saves24h.toLocaleString('fa-IR')}
                </td>
                <td className="pr-4 py-3">
                  <span
                    className={
                      row.growth7dPercent >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }
                  >
                    {row.growth7dPercent >= 0 ? '+' : ''}
                    {row.growth7dPercent.toLocaleString('fa-IR')}٪
                  </span>
                </td>
                <td className="pr-4 py-3">
                  <div className="relative inline-flex items-center gap-1">
                    <span className="tabular-nums font-medium">
                      {row.trendingScore.toLocaleString('fa-IR')}
                    </span>
                    {row.scoreBreakdown && row.scoreBreakdown.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPopoverId(popoverId === row.id ? null : row.id)
                          }
                          className="p-0.5 rounded hover:bg-[var(--color-bg)]"
                        >
                          <Info className="w-3.5 h-3.5 text-[var(--color-text-subtle)]" />
                        </button>
                        {popoverId === row.id && (
                          <div className="absolute left-0 top-full mt-1 z-20 min-w-[160px] rounded-xl bg-gray-900 text-white text-xs p-3 shadow-xl">
                            {row.scoreBreakdown.map((b, i) => (
                              <div key={i} className="flex justify-between gap-4">
                                <span>{b.label}</span>
                                <span className="tabular-nums">{b.value.toLocaleString('fa-IR')}</span>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setPopoverId(null)}
                              className="mt-2 text-[10px] text-gray-300 hover:text-white"
                            >
                              بستن
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="pr-4 py-3">
                  <span
                    className={`inline-flex items-center gap-0.5 ${
                      row.trend === 'up'
                        ? 'text-emerald-600'
                        : row.trend === 'down'
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {row.trend === 'up' && <ArrowUp className="w-4 h-4" />}
                    {row.trend === 'down' && <ArrowDown className="w-4 h-4" />}
                    {row.trend === 'neutral' && <Minus className="w-4 h-4" />}
                  </span>
                </td>
                <td className="pr-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/admin/lists/${row.id}/edit`}
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--primary)]"
                    >
                      ویرایش
                    </Link>
                    <Link
                      href={`/admin/lists/${row.id}/debug`}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      دیباگ
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          لیستی برای نمایش وجود ندارد.
        </div>
      )}
    </div>
  );
}
