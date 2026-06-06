'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { ExternalLink, Pencil, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-intelligence';
import { formatSaveGrowthDisplay } from '@/lib/admin/category-intelligence';
import ListCardMoreMenu from './ListCardMoreMenu';

interface ListIntelligenceTableProps {
  rows: ListIntelligenceRow[];
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

export default function ListIntelligenceTable({
  rows,
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
    <div className="rounded-xl border border-[var(--color-border-muted)] overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="overflow-auto max-h-[calc(100vh-10rem)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
              <th className="sticky top-0 z-20 bg-[var(--color-bg)] text-right py-2 px-3 text-xs font-semibold text-[var(--color-text-muted)]">
                لیست
              </th>
              <th className="sticky top-0 z-20 bg-[var(--color-bg)] text-right py-2 px-2 text-xs font-semibold text-[var(--color-text-muted)] w-[52px]">
                آیتم
              </th>
              <th className="sticky top-0 z-20 bg-[var(--color-bg)] text-right py-2 px-2 text-xs font-semibold text-[var(--color-text-muted)] w-[72px]">
                ذخیره
              </th>
              <th className="sticky top-0 z-20 bg-[var(--color-bg)] text-right py-2 px-2 text-xs font-semibold text-[var(--color-text-muted)] w-[52px]">
                ۲۴h
              </th>
              <th className="sticky top-0 z-20 bg-[var(--color-bg)] text-right py-2 px-2 text-xs font-semibold text-[var(--color-text-muted)] w-[56px]">
                امتیاز
              </th>
              {!isTrashView && (
                <th className="sticky top-0 z-20 bg-[var(--color-bg)] text-right py-2 px-2 text-xs font-semibold text-[var(--color-text-muted)] w-[72px]">
                  وضعیت
                </th>
              )}
              {isTrashView && (
                <>
                  <th className="sticky top-0 z-20 bg-[var(--color-bg)] text-right py-2 px-2 text-xs font-semibold text-[var(--color-text-muted)]">
                    حذف
                  </th>
                  <th className="sticky top-0 z-20 bg-[var(--color-bg)] text-right py-2 px-2 text-xs font-semibold text-[var(--color-text-muted)]">
                    توسط
                  </th>
                </>
              )}
              <th className="sticky top-0 left-0 z-30 bg-[var(--color-bg)] text-center py-2 px-2 text-xs font-semibold text-[var(--color-text-muted)] w-[88px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">
                ···
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
              const StatusIcon = status.Icon;
              const bg = rowBg(row, idx, isTrashView);
              const scoreNegative = row.trendingScore < 0;

              return (
                <tr
                  key={row.id}
                  onClick={() => {
                    if (!isTrashView) router.push(`/admin/items?listId=${row.id}`);
                  }}
                  className={`border-b border-[var(--color-border-muted)] transition-colors hover:bg-[var(--color-bg)]/60 ${bg} ${
                    !row.isActive && !isTrashView ? 'opacity-65' : ''
                  } ${!isTrashView ? 'cursor-pointer' : ''}`}
                >
                  <td className={`py-2 px-3 ${bg}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-9 h-9 shrink-0 rounded-lg overflow-hidden border border-[var(--color-border-muted)]">
                        {row.coverImage ? (
                          <ImageWithFallback
                            src={row.coverImage}
                            alt=""
                            className="object-cover w-full h-full"
                            listSlug={row.slug}
                            listTitle={row.title}
                            categorySlug={row.categorySlug}
                            fallbackIcon={row.categoryIcon}
                            fallbackClassName="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base bg-[var(--color-bg)]">
                            {row.categoryIcon}
                          </div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[7px] font-bold text-center tabular-nums">
                          {row.rank}
                        </span>
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
                        <p className="text-[10px] text-[var(--color-text-muted)] truncate">
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
                        className={`block text-[9px] ${
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

                  <td className={`py-2 px-2 tabular-nums whitespace-nowrap text-xs ${bg} ${row.saves24h > 0 ? 'text-emerald-600 font-semibold' : 'text-[var(--color-text-muted)]'}`}>
                    +{row.saves24h.toLocaleString('fa-IR')}
                  </td>

                  <td className={`py-2 px-2 tabular-nums whitespace-nowrap text-xs font-bold ${bg} ${scoreNegative ? 'text-red-600' : 'text-[var(--primary)]'}`}>
                    {row.trendingScore.toLocaleString('fa-IR')}
                  </td>

                  {!isTrashView && (
                    <td className={`py-2 px-2 ${bg}`}>
                      <div className="flex items-center gap-1">
                        <StatusIcon className={`w-3.5 h-3.5 ${status.className}`} aria-label={status.label} />
                        {!row.isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="غیرفعال" />}
                        {(row.riskLevel === 'medium' || row.riskLevel === 'high') && (
                          <span className="text-[8px] px-1 rounded bg-red-100 text-red-700 font-bold">!</span>
                        )}
                      </div>
                    </td>
                  )}

                  {isTrashView && (
                    <>
                      <td className={`py-2 px-2 text-xs text-[var(--color-text-muted)] whitespace-nowrap ${bg}`}>
                        {row.deletedAt ? new Date(row.deletedAt).toLocaleDateString('fa-IR') : '—'}
                      </td>
                      <td className={`py-2 px-2 text-xs text-[var(--color-text-muted)] truncate max-w-[80px] ${bg}`}>
                        {row.deletedBy?.name || row.deletedBy?.email || '—'}
                      </td>
                    </>
                  )}

                  <td className={`sticky left-0 z-10 py-1.5 px-1.5 ${bg} shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-0.5">
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
                            className="px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
                          >
                            بازگردانی
                          </button>
                        )
                      ) : (
                        <>
                          <Link
                            href={`/admin/lists/${row.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
                            title="ویرایش"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/lists/${row.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
                            title="اپ"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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
    </div>
  );
}
