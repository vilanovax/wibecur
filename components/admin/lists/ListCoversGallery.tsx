'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { ExternalLink, ImageOff, Pencil, Star } from 'lucide-react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-types';
import ListCardMoreMenu from './ListCardMoreMenu';
import ListCoverAuditModal from './ListCoverAuditModal';

export type ListAdminViewMode = 'grid' | 'table' | 'covers';

type Props = {
  rows: ListIntelligenceRow[];
  auditOpen: boolean;
  onAuditOpenChange: (open: boolean) => void;
  onFeatureToggle?: (id: string, isFeatured: boolean) => void;
  onDisableToggle?: (id: string, isActive: boolean) => void;
  onMoveToTrash?: (row: ListIntelligenceRow) => void;
  onOptimized?: () => void;
};

function CoverPreview({
  src,
  row,
  label,
  aspectClass,
  emptyHint,
}: {
  src: string | null | undefined;
  row: ListIntelligenceRow;
  label: string;
  aspectClass: string;
  emptyHint: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-[var(--color-text)] mb-2">{label}</p>
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-bg)] ${aspectClass}`}
      >
        {src?.trim() ? (
          <ImageWithFallback
            src={src}
            alt={row.title}
            className="object-cover w-full h-full"
            listSlug={row.slug}
            listTitle={row.title}
            categorySlug={row.categorySlug}
            fallbackIcon={row.categoryIcon}
            fallbackClassName="w-full h-full"
          />
        ) : (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 p-4 text-center">
            <ImageOff className="w-7 h-7 text-[var(--color-text-muted)]/50" />
            <span className="text-xs text-[var(--color-text-muted)]">{emptyHint}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListCoversGallery({
  rows,
  auditOpen,
  onAuditOpenChange,
  onFeatureToggle,
  onDisableToggle,
  onMoveToTrash,
  onOptimized,
}: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-text-muted)]">
        لیستی برای نمایش کاورها نیست.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {rows.map((row) => {
          const editHref = `/admin/lists/${row.id}/edit`;
          const siteHref = `/lists/${row.slug}`;

          return (
            <article
              key={row.id}
              className={`rounded-2xl border bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)] ${
                row.isFeatured
                  ? 'border-amber-400/60 ring-1 ring-amber-300/30'
                  : 'border-[var(--color-border-muted)]'
              } ${!row.isActive ? 'opacity-75' : ''}`}
            >
              <div className="px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-bg)]/30">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-sm text-[var(--color-text)] truncate" title={row.title}>
                    {row.title}
                  </h3>
                  {row.isFeatured ? <Star className="w-4 h-4 shrink-0 text-amber-500 fill-amber-500" /> : null}
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  {row.categoryIcon} {row.categoryName}
                  <span className="mx-1.5 opacity-30">·</span>
                  {row.itemCount.toLocaleString('fa-IR')} آیتم
                </p>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CoverPreview
                  src={row.coverImage}
                  row={row}
                  label="کاور عمودی"
                  aspectClass="aspect-[3/4] max-h-72"
                  emptyHint="کاور عمودی تنظیم نشده"
                />
                <CoverPreview
                  src={row.horizontalImage}
                  row={row}
                  label="بنر افقی"
                  aspectClass="aspect-[16/9] max-h-44 sm:max-h-none"
                  emptyHint="بنر افقی تنظیم نشده"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-0">
                <Link
                  href={editHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--primary)] text-white hover:opacity-90"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  ویرایش
                </Link>
                <Link
                  href={siteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  سایت
                </Link>
                {onFeatureToggle && onDisableToggle && onMoveToTrash ? (
                  <div className="mr-auto">
                    <ListCardMoreMenu
                      row={row}
                      onFeature={async () => {
                        const res = await fetch(`/api/admin/lists/${row.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isFeatured: !row.isFeatured }),
                        });
                        if (res.ok) onFeatureToggle(row.id, !row.isFeatured);
                      }}
                      onDisable={async () => {
                        if (row.isActive && !window.confirm('غیرفعال کردن این لیست؟')) return;
                        const res = await fetch(`/api/admin/lists/${row.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isActive: !row.isActive }),
                        });
                        if (res.ok) onDisableToggle(row.id, !row.isActive);
                      }}
                      onMoveToTrash={() => onMoveToTrash(row)}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <ListCoverAuditModal
        open={auditOpen}
        onClose={() => onAuditOpenChange(false)}
        rows={rows}
        onFeatureToggle={onFeatureToggle}
        onDisableToggle={onDisableToggle}
        onMoveToTrash={onMoveToTrash}
        onOptimized={onOptimized}
      />
    </>
  );
}
