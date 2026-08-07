'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ImageIcon } from 'lucide-react';
import type { ContentHubStats } from '@/lib/admin/content-hub-stats';

type ContentHubView = 'lists' | 'catalog' | 'import' | 'people' | 'descriptions' | 'item-tips';

interface ContentHubStatsBarProps {
  stats: ContentHubStats;
  view: ContentHubView;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function StatChip({
  label,
  value,
  href,
  active,
  tone = 'default',
  ok = false,
}: {
  label: string;
  value: number;
  href?: string;
  active?: boolean;
  tone?: 'default' | 'amber' | 'violet' | 'emerald' | 'rose';
  ok?: boolean;
}) {
  const tones = {
    default: active
      ? 'bg-gray-900 text-white border-gray-900'
      : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border-muted)] hover:border-[var(--primary)]/30',
    amber: active
      ? 'bg-amber-600 text-white border-amber-600'
      : ok
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
    violet: active
      ? 'bg-violet-600 text-white border-violet-600'
      : 'bg-violet-50 text-violet-900 border-violet-200 hover:bg-violet-100',
    emerald: active
      ? 'bg-emerald-600 text-white border-emerald-600'
      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100',
    rose: active
      ? 'bg-rose-600 text-white border-rose-600'
      : ok
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100',
  };

  const className = `inline-flex flex-col items-center justify-center min-w-[4.25rem] px-2.5 py-2 rounded-xl border text-center transition-colors ${tones[tone]}`;

  const content = (
    <>
      <span className="text-base font-bold tabular-nums leading-none">
        {value.toLocaleString('fa-IR')}
      </span>
      <span className="text-[10px] font-medium mt-1 leading-tight opacity-90">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function healthSummary(stats: ContentHubStats): string {
  const issues = [
    stats.catalogExternalImages > 0 && `${stats.catalogExternalImages} تصویر خارجی`,
    stats.itemsMissingTip > 0 && `${stats.itemsMissingTip} tip خالی`,
    stats.listsMissingDescription > 0 && `${stats.listsMissingDescription} توضیح خالی`,
    stats.listsMissingCover > 0 && `${stats.listsMissingCover} بدون کاور`,
  ].filter(Boolean);

  if (issues.length > 0) return issues.join(' · ');
  return `${stats.activeLists.toLocaleString('fa-IR')} لیست · ${stats.catalogEntities.toLocaleString('fa-IR')} کاتالوگ`;
}

export default function ContentHubStatsBar({
  stats,
  view,
  collapsed = false,
  onToggleCollapse,
}: ContentHubStatsBarProps) {
  const hasHealthIssues =
    stats.catalogExternalImages > 0 ||
    stats.catalogMissingPosters > 0 ||
    stats.itemsMissingTip > 0 ||
    stats.listsMissingDescription > 0 ||
    stats.listsMissingCover > 0 ||
    stats.duplicateCatalogGroups > 0 ||
    stats.suggestionsPending > 0;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] text-sm hover:bg-[var(--color-bg)]/50 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0 text-[var(--color-text-muted)]">
          {hasHealthIssues ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span className="truncate tabular-nums">{healthSummary(stats)}</span>
        </span>
        <span className="text-xs text-[var(--primary)] shrink-0">نمایش آمار</span>
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--color-text)]">وضعیت محتوا</p>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            جمع کردن
          </button>
        )}
      </div>

      <div>
        <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1.5">حجم</p>
        <div className="flex flex-wrap gap-2">
          <StatChip
            label="لیست فعال"
            value={stats.activeLists}
            href="/admin/lists"
            active={view === 'lists'}
          />
          <StatChip
            label="کاتالوگ"
            value={stats.catalogEntities}
            href="/admin/lists?view=catalog"
            active={view === 'catalog'}
            tone="violet"
          />
          <StatChip
            label="جایگاه"
            value={stats.placements}
            href="/admin/lists?view=catalog"
          />
          {stats.multiListCatalog > 0 && (
            <StatChip
              label="چندلیستی"
              value={stats.multiListCatalog}
              href="/admin/lists?view=catalog&multiList=1"
              tone="violet"
            />
          )}
          {stats.lowEngagementLists > 0 && (
            <StatChip
              label="کم‌تعامل"
              value={stats.lowEngagementLists}
              href="/admin/lists"
              tone="amber"
            />
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <p className="text-[10px] font-semibold text-[var(--color-text-muted)]">نیاز به توجه</p>
          {(stats.catalogExternalImages > 0 || stats.catalogMissingPosters > 0) && (
            <Link
              href="/admin/catalog/storage-images"
              className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-orange-700 transition-colors"
              title="جستجوی Google و آپلود تصویر روی ParsPack"
            >
              <ImageIcon className="w-3 h-3" />
              تصاویر
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatChip
            label="تصویر خارجی"
            value={stats.catalogExternalImages}
            href="/admin/catalog/storage-images?status=external"
            tone="rose"
            ok={stats.catalogExternalImages === 0}
          />
          <StatChip
            label="بدون تصویر"
            value={stats.catalogMissingPosters}
            href="/admin/catalog/storage-images?status=missing"
            tone="rose"
            ok={stats.catalogMissingPosters === 0}
          />
          <StatChip
            label="tip خالی"
            value={stats.itemsMissingTip}
            href="/admin/lists?view=item-tips"
            active={view === 'item-tips'}
            tone="amber"
            ok={stats.itemsMissingTip === 0}
          />
          <StatChip
            label="توضیح خالی"
            value={stats.listsMissingDescription}
            href="/admin/lists?view=descriptions"
            active={view === 'descriptions'}
            tone="amber"
            ok={stats.listsMissingDescription === 0}
          />
          <StatChip
            label="لیست بدون کاور"
            value={stats.listsMissingCover}
            href="/admin/lists?filter=no_cover"
            tone="amber"
            ok={stats.listsMissingCover === 0}
          />
          {stats.duplicateCatalogGroups > 0 && (
            <StatChip
              label="تکراری"
              value={stats.duplicateCatalogGroups}
              href="/admin/lists?view=catalog&tab=duplicates"
              tone="amber"
            />
          )}
          {stats.suggestionsPending > 0 && (
            <StatChip
              label="پیشنهاد"
              value={stats.suggestionsPending}
              href="/admin/suggestions"
              tone="emerald"
            />
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] flex items-start gap-1.5">
        {hasHealthIssues ? (
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
        )}
        <span>{stats.insightLine}</span>
      </p>
    </section>
  );
}
