'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-intelligence';

const STATUS_LABEL = { rising: 'صعودی', stable: 'ثابت', declining: 'نزولی' };
const RISK_LABEL = { none: '—', low: 'کم', medium: 'متوسط', high: 'بالا' };

interface ListIntelligenceTableProps {
  rows: ListIntelligenceRow[];
  isTrashView?: boolean;
  onFeatureToggle?: (id: string, isFeatured: boolean) => void;
  onDisableToggle?: (id: string, isActive: boolean) => void;
  onMoveToTrash?: (row: ListIntelligenceRow) => void;
  onRestore?: (id: string) => void;
}

export default function ListIntelligenceTable({
  rows,
  isTrashView,
  onFeatureToggle,
  onDisableToggle,
  onMoveToTrash,
  onRestore,
}: ListIntelligenceTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleFeature = async (row: ListIntelligenceRow) => {
    if (!onFeatureToggle) return;
    setLoadingId(row.id);
    try {
      const res = await fetch(`/api/admin/lists/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !row.isFeatured }),
      });
      if (res.ok) onFeatureToggle(row.id, !row.isFeatured);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDisable = async (row: ListIntelligenceRow) => {
    if (!onDisableToggle) return;
    const next = !row.isActive;
    if (next && !confirm('غیرفعال کردن این لیست؟')) return;
    setLoadingId(row.id);
    try {
      const res = await fetch(`/api/admin/lists/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !next }),
      });
      if (res.ok) onDisableToggle(row.id, !next);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-muted)] overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
            <tr>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)] w-16">
                رتبه
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                عنوان
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                دسته
              </th>
              {isTrashView && (
                <>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                    حذف در
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                    حذف توسط
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                    دلیل
                  </th>
                </>
              )}
              <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                ذخیره
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                ۲۴h
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                امتیاز
              </th>
              {!isTrashView && (
                <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                  ریسک
                </th>
              )}
              <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)] w-40">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--color-border-muted)] hover:bg-[var(--color-bg)] transition-colors"
              >
                <td className="py-3 px-4 text-sm tabular-nums text-[var(--color-text)]">
                  #{row.rank}
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/admin/lists/${row.id}/edit`}
                    className="font-medium text-[var(--color-text)] hover:text-[var(--primary)]"
                  >
                    {row.title}
                  </Link>
                </td>
                <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">
                  {row.categoryName}
                </td>
                {isTrashView && (
                  <>
                    <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">
                      {row.deletedAt
                        ? new Date(row.deletedAt).toLocaleDateString('fa-IR')
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">
                      {row.deletedBy?.name || row.deletedBy?.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">
                      {row.deleteReason || '—'}
                    </td>
                  </>
                )}
                <td className="py-3 px-4 text-sm tabular-nums">
                  {row.saveCount.toLocaleString('fa-IR')}
                  {row.growth7dPercent !== 0 && (
                    <span
                      className={
                        row.growth7dPercent > 0
                          ? 'text-emerald-600 text-xs mr-1'
                          : 'text-red-600 text-xs mr-1'
                      }
                    >
                      ({row.growth7dPercent > 0 ? '+' : ''}
                      {row.growth7dPercent}٪)
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm tabular-nums text-emerald-600">
                  +{row.saves24h.toLocaleString('fa-IR')}
                </td>
                <td className="py-3 px-4 text-sm font-medium tabular-nums" style={{ color: 'var(--primary)' }}>
                  {row.trendingScore.toLocaleString('fa-IR')}
                </td>
                {!isTrashView && (
                  <td className="py-3 px-4 text-sm text-[var(--color-text-muted)]">
                    {RISK_LABEL[row.riskLevel]}
                  </td>
                )}
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1 justify-end">
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
                          disabled={loadingId !== null}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        >
                          بازگردانی
                        </button>
                      )
                    ) : (
                      <>
                        <Link
                          href={`/admin/lists/${row.id}/edit`}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
                        >
                          ویرایش
                        </Link>
                        <Link
                          href={`/admin/lists/${row.id}/debug`}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]"
                        >
                          دیباگ
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleFeature(row)}
                          disabled={loadingId !== null}
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            row.isFeatured
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          {row.isFeatured ? 'ویژه ✓' : 'ویژه'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisable(row)}
                          disabled={loadingId !== null}
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            row.isActive
                              ? 'text-[var(--color-text-muted)] hover:text-red-600'
                              : 'text-red-600'
                          }`}
                        >
                          {row.isActive ? 'غیرفعال' : 'فعال'}
                        </button>
                        {onMoveToTrash && (
                          <button
                            type="button"
                            onClick={() => onMoveToTrash(row)}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-rose-100 text-rose-800 hover:bg-rose-200"
                          >
                            انتقال به زباله‌دان
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
