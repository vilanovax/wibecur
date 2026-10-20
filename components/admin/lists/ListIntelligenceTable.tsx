'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { ExternalLink, Pencil, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-types';
import { formatSaveGrowthDisplay } from '@/lib/admin/category-intelligence';
import ListCardMoreMenu from './ListCardMoreMenu';

interface ListIntelligenceTableProps {
  rows: ListIntelligenceRow[];
  sortBy?: string;
  onSortChange?: (next: string) => void;
  isTrashView?: boolean;
  onFeatureToggle?: (id: string, isFeatured: boolean) => void;
  onDisableToggle?: (id: string, isActive: boolean) => void;
  onMoveToTrash?: (row: ListIntelligenceRow) => void;
  onRestore?: (id: string) => void;
}

const STATUS_ICON = {
  rising: { Icon: TrendingUp, className: 'text-emerald-600', label: 'صعودی' },
  stable: { Icon: Minus, className: 'text-[var(--color-text-muted)]', label: 'ثابت' },
  declining: { Icon: TrendingDown, className: 'text-red-600', label: 'نزولی' },
};

function rowBg(row: ListIntelligenceRow, idx: number, isTrashView?: boolean) {
  if (row.isFeatured && !isTrashView) return 'bg-amber-50/40 dark:bg-amber-900/10';
  if (idx % 2 === 1) return 'bg-[var(--color-bg)]/30';
  return 'bg-[var(--color-surface)]';
}

function toggleSort(current: string, desc: string, asc: string) {
  return current === desc ? asc : desc;
}

export default function ListIntelligenceTable({
  rows,
  sortBy = 'score_desc',
  onSortChange,
  isTrashView,
  onFeatureToggle,
  onDisableToggle,
  onMoveToTrash,
  onRestore,
}: ListIntelligenceTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ id: string; kind: 'feature' | 'disable' } | null>(null);

  const handleFeature = async (row: ListIntelligenceRow) => {
    if (!onFeatureToggle) return;
    setActionLoading({ id: row.id, kind: 'feature' });
    try {
      const res = await fetch(`/api/admin/lists/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !row.isFeatured }),
      });
      if (res.ok) onFeatureToggle(row.id, !row.isFeatured);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = async (row: ListIntelligenceRow) => {
    if (!onDisableToggle) return;
    if (row.isActive && !confirm('غیرفعال کردن این لیست؟')) return;
    setActionLoading({ id: row.id, kind: 'disable' });
    try {
      const res = await fetch(`/api/admin/lists/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      if (res.ok) onDisableToggle(row.id, !row.isActive);
    } finally {
      setActionLoading(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-text-muted)]">
        لیستی برای نمایش در جدول نیست.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <th className="bg-[var(--color-bg)] px-3 py-2 text-start text-xs font-semibold text-[var(--color-text-muted)]">
                لیست
              </th>
              <th className="bg-[var(--color-bg)] px-2 py-2 text-start">
                <button type="button" onClick={() => onSortChange?.(toggleSort(sortBy, 'items_desc', 'items_asc'))} className={`inline-flex min-h-11 items-center text-xs font-semibold ${sortBy.startsWith('items') ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                  آیتم
                </button>
              </th>
              <th className="bg-[var(--color-bg)] px-2 py-2 text-start">
                <button type="button" onClick={() => onSortChange?.(toggleSort(sortBy, 'saves_desc', 'saves_asc'))} className={`inline-flex min-h-11 items-center text-xs font-semibold ${sortBy.startsWith('saves') ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                  ذخیره
                </button>
              </th>
              <th className="bg-[var(--color-bg)] px-2 py-2 text-start">
                <button type="button" onClick={() => onSortChange?.(toggleSort(sortBy, '24h_desc', '24h_asc'))} className={`inline-flex min-h-11 items-center text-xs font-semibold ${sortBy.startsWith('24h') ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                  ۲۴ ساعت
                </button>
              </th>
              <th className="bg-[var(--color-bg)] px-2 py-2 text-start">
                <button type="button" onClick={() => onSortChange?.(toggleSort(sortBy, 'score_desc', 'score_asc'))} className={`inline-flex min-h-11 items-center text-xs font-semibold ${sortBy.startsWith('score') ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                  امتیاز
                </button>
              </th>
              {!isTrashView && (
                <th className="bg-[var(--color-bg)] px-2 py-2 text-start text-xs font-semibold text-[var(--color-text-muted)]">
                  وضعیت
                </th>
              )}
              {isTrashView && (
                <>
                  <th className="bg-[var(--color-bg)] px-2 py-2 text-start text-xs font-semibold text-[var(--color-text-muted)]">
                    حذف
                  </th>
                  <th className="bg-[var(--color-bg)] px-2 py-2 text-start text-xs font-semibold text-[var(--color-text-muted)]">
                    توسط
                  </th>
                </>
              )}
              <th className="sticky end-0 z-20 border-s border-[var(--color-border-muted)] bg-[var(--color-bg)] px-2 py-2 text-center text-xs font-semibold text-[var(--color-text-muted)]">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const growth = formatSaveGrowthDisplay(
                row.growth7dRecent,
                row.growth7dPrevious,
                row.growth7dPercent
              );
              const status = STATUS_ICON[row.status];
              const bg = rowBg(row, idx, isTrashView);
              const scoreNegative = row.trendingScore < 0;

              return (
                <tr
                  key={row.id}
                  onClick={(e) => {
                    if (isTrashView) return;
                    const target = e.target as HTMLElement;
                    if (target.closest('[data-list-ops]')) return;
                    router.push(`/admin/lists/${row.id}`);
                  }}
                  className={`border-b border-[var(--color-border-muted)] transition-colors hover:bg-[var(--color-bg)]/60 ${bg} ${
                    !row.isActive && !isTrashView ? 'opacity-65' : ''
                  } ${!isTrashView ? 'cursor-pointer' : ''}`}
                >
                  <td className={`py-2 px-3 ${bg}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 shrink-0 text-center text-xs tabular-nums text-[var(--color-text-muted)]">
                        {row.rank.toLocaleString('fa-IR')}
                      </span>
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border-muted)] aspect-square">
                        {row.coverImage ? (
                          <ImageWithFallback
                            src={row.coverImage}
                            alt=""
                            className="h-full w-full object-cover"
                            listSlug={row.slug}
                            listTitle={row.title}
                            categorySlug={row.categorySlug}
                            fallbackIcon={row.categoryIcon}
                            fallbackClassName="h-full w-full"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg)] text-base">
                            {row.categoryIcon}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className="font-medium text-[var(--color-text)] group-hover:text-[var(--primary)] truncate text-sm"
                            title={row.title}
                          >
                            {row.title}
                          </span>
                          {row.isFeatured && !isTrashView && (
                            <Star className="w-3 h-3 shrink-0 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <p className="truncate text-xs text-[var(--color-text-muted)]">
                          {row.categoryName}
                          <span className="mx-1 opacity-30">·</span>
                          {row.ownerUsername || row.ownerName}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className={`py-2 px-2 tabular-nums whitespace-nowrap text-xs ${bg}`}>
                    <span
                      className={`font-semibold ${
                        row.itemCount === 0 ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'
                      }`}
                    >
                      {row.itemCount.toLocaleString('fa-IR')}
                    </span>
                  </td>

                  <td className={`py-2 px-2 tabular-nums whitespace-nowrap ${bg}`}>
                    <span className="font-medium">{row.saveCount.toLocaleString('fa-IR')}</span>
                    {growth.label !== '—' && (
                      <span
                        className={`block text-xs ${
                          growth.tone === 'positive' || growth.tone === 'new'
                            ? 'text-emerald-600'
                            : growth.tone === 'negative'
                              ? 'text-red-600'
                              : 'text-[var(--color-text-muted)]'
                        }`}
                      >
                        {growth.label}
                      </span>
                    )}
                  </td>

                  <td className={`whitespace-nowrap px-2 py-2 text-xs tabular-nums ${bg} ${row.saves24h > 0 ? 'font-semibold text-emerald-600' : 'text-[var(--color-text-muted)]'}`}>
                    {row.saves24h > 0
                      ? `+${row.saves24h.toLocaleString('fa-IR')}`
                      : row.saves24h.toLocaleString('fa-IR')}
                  </td>

                  <td className={`py-2 px-2 tabular-nums whitespace-nowrap text-xs font-bold ${bg} ${scoreNegative ? 'text-red-600' : 'text-[var(--primary)]'}`}>
                    {row.trendingScore.toLocaleString('fa-IR')}
                  </td>

                  {!isTrashView && (
                    <td className={`py-2 px-2 ${bg}`}>
                      <div className="flex items-center gap-1 text-xs">
                        <span className={status.className}>{status.label}</span>
                        {!row.isActive && <span className="size-2 rounded-full bg-red-500" title="غیرفعال" />}
                        {(row.riskLevel === 'medium' || row.riskLevel === 'high') && (
                          <span className="rounded bg-red-100 px-1 text-xs font-bold text-red-700">!</span>
                        )}
                      </div>
                    </td>
                  )}

                  {isTrashView && (
                    <>
                      <td className={`py-2 px-2 text-xs text-[var(--color-text-muted)] whitespace-nowrap ${bg}`}>
                        {row.deletedAt ? new Date(row.deletedAt).toLocaleDateString('fa-IR') : '—'}
                      </td>
                      <td className={`max-w-24 truncate px-2 py-2 text-xs text-[var(--color-text-muted)] ${bg}`}>
                        {row.deletedBy?.name || row.deletedBy?.email || '—'}
                      </td>
                    </>
                  )}

                  <td
                    data-list-ops=""
                    className={`sticky end-0 z-20 overflow-visible border-s border-[var(--color-border-muted)] px-2 py-2 ${bg}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative z-20 flex items-center justify-center gap-1">
                      {isTrashView ? (
                        onRestore && (
                          <button
                            type="button"
                            onClick={async () => {
                              setLoadingId(row.id);
                              try {
                                await onRestore(row.id);
                              } finally {
                                setLoadingId(null);
                              }
                            }}
                            disabled={loadingId === row.id}
                            className="inline-flex min-h-11 items-center rounded-xl bg-emerald-100 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
                          >
                            بازگردانی
                          </button>
                        )
                      ) : (
                        <>
                          <Link
                            href={`/admin/lists/${row.id}/edit`}
                            data-list-ops=""
                            className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-[var(--primary)] px-3 text-xs font-semibold text-white hover:opacity-90"
                          >
                            <Pencil className="size-4" />
                            ویرایش
                          </Link>
                          <Link
                            href={`/lists/${row.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-list-ops=""
                            className="inline-flex size-11 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
                            aria-label="نمایش در سایت"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                          <ListCardMoreMenu
                            row={row}
                            onFeature={() => handleFeature(row)}
                            onDisable={() => handleDisable(row)}
                            onMoveToTrash={onMoveToTrash ? () => onMoveToTrash(row) : undefined}
                            featureLoading={actionLoading?.id === row.id && actionLoading.kind === 'feature'}
                            disableLoading={actionLoading?.id === row.id && actionLoading.kind === 'disable'}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
    </div>
  );
}
