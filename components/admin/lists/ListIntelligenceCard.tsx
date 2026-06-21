'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import {
  Star,
  ExternalLink,
  Pencil,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-intelligence';
import { formatSaveGrowthDisplay } from '@/lib/admin/category-intelligence';
import ListCardMoreMenu from './ListCardMoreMenu';

interface ListIntelligenceCardProps {
  row: ListIntelligenceRow;
  isTrashView?: boolean;
  onFeatureToggle?: (id: string, isFeatured: boolean) => void;
  onDisableToggle?: (id: string, isActive: boolean) => void;
  onMoveToTrash?: () => void;
  onRestore?: (id: string) => void;
}

function CoverThumb({ row }: { row: ListIntelligenceRow }) {
  return (
    <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-[var(--color-border-muted)]">
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
        <div
          className="w-full h-full flex items-center justify-center text-xl"
          style={{ background: `linear-gradient(135deg, ${row.categoryIcon ? 'var(--color-bg)' : '#6366F1'}22, var(--color-bg))` }}
        >
          {row.categoryIcon}
        </div>
      )}
      <span className="absolute bottom-0 inset-x-0 bg-black/65 text-white text-[8px] font-bold text-center py-px tabular-nums">
        #{row.rank}
      </span>
    </div>
  );
}

export default function ListIntelligenceCard({
  row,
  isTrashView,
  onFeatureToggle,
  onDisableToggle,
  onMoveToTrash,
  onRestore,
}: ListIntelligenceCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'feature' | 'disable' | 'restore' | null>(null);
  const growth = formatSaveGrowthDisplay(
    row.growth7dRecent,
    row.growth7dPrevious,
    row.growth7dPercent
  );

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
      else router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleDisable = async () => {
    if (!onDisableToggle) return;
    if (row.isActive && !window.confirm('غیرفعال کردن این لیست؟')) return;
    setLoading('disable');
    try {
      const res = await fetch(`/api/admin/lists/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      if (res.ok) onDisableToggle(row.id, !row.isActive);
    } finally {
      setLoading(null);
    }
  };

  const itemsHref = `/admin/lists/${row.id}`;
  const editHref = `/admin/lists/${row.id}/edit`;
  const scoreNegative = row.trendingScore < 0;

  return (
    <article
      className={`group rounded-xl bg-[var(--color-surface)] border overflow-hidden transition-all hover:shadow-md ${
        row.isFeatured && !isTrashView
          ? 'border-amber-400/60 ring-1 ring-amber-300/30'
          : 'border-[var(--color-border-muted)] hover:border-[var(--color-border)]'
      } ${!row.isActive && !isTrashView ? 'opacity-70' : ''}`}
    >
      <Link href={itemsHref} className="block p-3 hover:bg-[var(--color-bg)]/50 transition-colors">
        <div className="flex gap-3">
          <CoverThumb row={row} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-semibold text-sm text-[var(--color-text)] truncate flex-1" title={row.title}>
                {row.title}
              </h3>
              {row.isFeatured && !isTrashView && (
                <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-semibold">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Featured
                </span>
              )}
              {!row.isActive && !isTrashView && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" title="غیرفعال" />
              )}
            </div>

            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate">
              <span className="font-medium text-[var(--color-text)] tabular-nums">
                {row.itemCount.toLocaleString('fa-IR')} آیتم
              </span>
              <span className="mx-1 opacity-30">·</span>
              {row.categoryIcon} {row.categoryName}
              <span className="mx-1 opacity-30">·</span>
              {row.ownerUsername || row.ownerName}
            </p>

            {/* متریک‌ها — گرید ۲×۲ */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
              <Stat label="ذخیره" value={row.saveCount.toLocaleString('fa-IR')} sub={growth.label !== '—' ? growth.label : undefined} subTone={growth.tone} />
              <Stat label="۲۴س" value={`+${row.saves24h.toLocaleString('fa-IR')}`} highlight={row.saves24h > 0} />
              <Stat label="تعامل" value={`${row.engagementRatio}٪`} />
              <Stat
                label="امتیاز"
                value={row.trendingScore.toLocaleString('fa-IR')}
                primary={!scoreNegative}
                danger={scoreNegative}
              />
            </div>

            {row.status !== 'stable' && !isTrashView && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium">
                {row.status === 'rising' ? (
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span className={row.status === 'rising' ? 'text-emerald-600' : 'text-red-600'}>
                  {row.status === 'rising' ? 'در حال رشد' : 'نزولی'}
                </span>
              </p>
            )}
          </div>
        </div>
      </Link>

      <div
        className="flex items-center gap-1.5 px-3 py-2 border-t border-[var(--color-border-muted)] bg-[var(--color-bg)]/40"
        onClick={(e) => e.preventDefault()}
      >
        {isTrashView ? (
          <>
            {row.deletedAt && (
              <span className="text-[10px] text-[var(--color-text-muted)] flex-1 truncate">
                {new Date(row.deletedAt).toLocaleDateString('fa-IR')}
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
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
              >
                بازگردانی
              </button>
            )}
          </>
        ) : (
          <>
            <Link
              href={editHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--primary)] text-white hover:opacity-90"
            >
              <Pencil className="w-3 h-3" />
              ویرایش
            </Link>
            <Link
              href={`/lists/${row.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
              title="نمایش در سایت"
            >
              <ExternalLink className="w-3 h-3" />
              سایت
            </Link>
            <div className="mr-auto">
              <ListCardMoreMenu
                row={row}
                onFeature={handleFeature}
                onDisable={handleDisable}
                onMoveToTrash={onMoveToTrash}
                featureLoading={loading === 'feature'}
                disableLoading={loading === 'disable'}
              />
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  sub,
  subTone,
  highlight,
  primary,
  danger,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: string;
  highlight?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] text-[var(--color-text-muted)] leading-none">{label}</p>
      <p
        className={`text-xs font-bold tabular-nums leading-tight mt-0.5 ${
          danger ? 'text-red-600' : primary ? 'text-[var(--primary)]' : highlight ? 'text-emerald-600' : 'text-[var(--color-text)]'
        }`}
      >
        {value}
        {sub && (
          <span
            className={`text-[9px] font-medium mr-1 ${
              subTone === 'positive' || subTone === 'new'
                ? 'text-emerald-600'
                : subTone === 'negative'
                  ? 'text-red-600'
                  : 'text-[var(--color-text-muted)]'
            }`}
          >
            ({sub})
          </span>
        )}
      </p>
    </div>
  );
}
