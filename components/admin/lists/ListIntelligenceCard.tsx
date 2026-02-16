'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-intelligence';

const STATUS_CONFIG = {
  rising: { label: 'صعودی', className: 'bg-emerald-100 text-emerald-800' },
  stable: { label: 'ثابت', className: 'bg-amber-100 text-amber-800' },
  declining: { label: 'نزولی', className: 'bg-red-100 text-red-800' },
};

const RISK_CONFIG = {
  none: '',
  low: 'bg-[var(--color-bg)] text-[var(--color-text-muted)]',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
};

interface ListIntelligenceCardProps {
  row: ListIntelligenceRow;
  isTrashView?: boolean;
  onFeatureToggle?: (id: string, isFeatured: boolean) => void;
  onDisableToggle?: (id: string, isActive: boolean) => void;
  onMoveToTrash?: () => void;
  onRestore?: (id: string) => void;
}

export default function ListIntelligenceCard({
  row,
  isTrashView,
  onFeatureToggle,
  onDisableToggle,
  onMoveToTrash,
  onRestore,
}: ListIntelligenceCardProps) {
  const [loading, setLoading] = useState<'feature' | 'disable' | 'restore' | null>(null);
  const statusConf = STATUS_CONFIG[row.status];
  const riskConf = RISK_CONFIG[row.riskLevel];

  const handleFeature = async () => {
    if (!onFeatureToggle) return;
    setLoading('feature');
    try {
      const res = await fetch(`/api/admin/lists/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !row.isFeatured }),
      });
      if (res.ok) onFeatureToggle(row.id, !row.isFeatured);
    } finally {
      setLoading(null);
    }
  };

  const handleDisable = async () => {
    if (!onDisableToggle) return;
    const next = !row.isActive;
    if (next && !confirm('غیرفعال کردن این لیست؟')) return;
    setLoading('disable');
    try {
      const res = await fetch(`/api/admin/lists/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !next }),
      });
      if (res.ok) onDisableToggle(row.id, !next);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-muted)] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
      <div className="flex gap-4 p-4">
        {row.coverImage && (
          <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-bg)]">
            <Image
              src={row.coverImage}
              alt=""
              fill
              className="object-cover"
              unoptimized
              sizes="80px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg)] px-2 py-0.5 rounded-lg">
              #{row.rank}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-[var(--color-border-muted)]">
              {row.categoryName}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-lg ${statusConf.className}`}>
              {statusConf.label}
            </span>
            {row.riskLevel !== 'none' && (
              <span className={`text-xs px-2 py-0.5 rounded-lg ${riskConf}`}>
                ریسک {row.riskLevel === 'medium' ? 'متوسط' : row.riskLevel === 'high' ? 'بالا' : 'کم'}
              </span>
            )}
            {!row.isActive && !isTrashView && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-red-100 text-red-800">
                غیرفعال
              </span>
            )}
            {isTrashView && row.deletedAt && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800">
                حذف‌شده
              </span>
            )}
          </div>
          <h3 className="font-semibold text-[var(--color-text)] truncate mb-0.5">
            {row.title}
          </h3>
          {row.description && (
            <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-3">
              {row.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-[var(--color-text)]">
              ذخیره: <strong>{row.saveCount.toLocaleString('fa-IR')}</strong>
              {row.growth7dPercent !== 0 && (
                <span
                  className={
                    row.growth7dPercent > 0
                      ? 'text-emerald-600 mr-1'
                      : 'text-red-600 mr-1'
                  }
                >
                  ({row.growth7dPercent > 0 ? '+' : ''}
                  {row.growth7dPercent.toLocaleString('fa-IR')}٪ ۷روز)
                </span>
              )}
            </span>
            <span className="text-[var(--color-text-muted)]">
              ۲۴h:{' '}
              <span
                className={
                  row.saves24h > 0 ? 'text-emerald-600 font-medium' : ''
                }
              >
                +{row.saves24h.toLocaleString('fa-IR')}
              </span>
            </span>
            <span className="text-[var(--color-text-muted)]">
              نسبت درگیری: {row.engagementRatio.toLocaleString('fa-IR')}٪
            </span>
            <span className="font-medium" style={{ color: 'var(--primary)' }}>
              امتیاز: {row.trendingScore.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-4 pb-4 pt-0 border-t border-[var(--color-border-muted)] mt-0 pt-3">
        {isTrashView ? (
          <>
            {row.deletedAt && (
              <span className="text-xs text-[var(--color-text-muted)] px-2 py-1">
                حذف: {new Date(row.deletedAt).toLocaleDateString('fa-IR')}
                {row.deletedBy && ` توسط ${row.deletedBy.name || row.deletedBy.email}`}
                {row.deleteReason && ` — ${row.deleteReason}`}
              </span>
            )}
            {onRestore && (
              <button
                type="button"
                onClick={async () => {
                  setLoading('restore');
                  try {
                    await onRestore(row.id);
                  } finally {
                    setLoading(null);
                  }
                }}
                disabled={loading !== null}
                className="px-3 py-1.5 rounded-xl text-sm font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
              >
                {loading === 'restore' ? '…' : 'بازگردانی'}
              </button>
            )}
          </>
        ) : (
          <>
            <Link
              href={`/admin/lists/${row.id}/edit`}
              className="px-3 py-1.5 rounded-xl text-sm font-medium bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
            >
              ویرایش
            </Link>
            <Link
              href={`/admin/lists/${row.id}/debug`}
              className="px-3 py-1.5 rounded-xl text-sm font-medium bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
            >
              دیباگ
            </Link>
            <button
              type="button"
              onClick={handleFeature}
              disabled={loading !== null}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                row.isFeatured
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
              }`}
              title={row.isFeatured ? 'حذف از ویژه' : 'ویژه کردن'}
            >
              <Star className="w-3.5 h-3.5 inline-block ml-1" />
              {row.isFeatured ? 'ویژه ✓' : 'ویژه'}
            </button>
            <button
              type="button"
              onClick={handleDisable}
              disabled={loading !== null}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                row.isActive
                  ? 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-red-100 hover:text-red-700'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              title={row.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
            >
              {row.isActive ? 'غیرفعال' : 'فعال'}
            </button>
            {onMoveToTrash && (
              <button
                type="button"
                onClick={onMoveToTrash}
                className="px-3 py-1.5 rounded-xl text-sm font-medium bg-rose-100 text-rose-800 hover:bg-rose-200"
                title="انتقال به زباله‌دان"
              >
                انتقال به زباله‌دان
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
