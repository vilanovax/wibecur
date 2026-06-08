'use client';

import Link from 'next/link';
import type { ContentHubStats } from '@/lib/admin/content-hub-stats';

type ContentHubView = 'lists' | 'catalog' | 'import';

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
}: {
  label: string;
  value: number;
  href?: string;
  active?: boolean;
  tone?: 'default' | 'amber' | 'violet' | 'emerald';
}) {
  const tones = {
    default: active
      ? 'bg-gray-900 text-white'
      : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border-muted)] hover:border-[var(--primary)]/30',
    amber: active
      ? 'bg-amber-600 text-white'
      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
    violet: active
      ? 'bg-violet-600 text-white'
      : 'bg-violet-50 text-violet-900 border-violet-200 hover:bg-violet-100',
    emerald: active
      ? 'bg-emerald-600 text-white'
      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100',
  };

  const className = `inline-flex flex-col items-center justify-center min-w-[4.5rem] px-3 py-2 rounded-xl border text-center transition-colors ${tones[tone]}`;

  const content = (
    <>
      <span className="text-lg font-bold tabular-nums leading-none">
        {value.toLocaleString('fa-IR')}
      </span>
      <span className="text-[10px] font-medium mt-1 opacity-90">{label}</span>
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

export default function ContentHubStatsBar({
  stats,
  view,
  collapsed = false,
  onToggleCollapse,
}: ContentHubStatsBarProps) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] text-sm hover:bg-[var(--color-bg)]/50 transition-colors"
      >
        <span className="text-[var(--color-text-muted)] tabular-nums">
          {stats.activeLists.toLocaleString('fa-IR')} لیست ·{' '}
          {stats.catalogEntities.toLocaleString('fa-IR')} کاتالوگ ·{' '}
          {stats.placements.toLocaleString('fa-IR')} جایگاه
        </span>
        <span className="text-xs text-[var(--primary)]">نمایش آمار</span>
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-[var(--color-text)]">خلاصه محتوا</p>
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
          tone="default"
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
      {stats.insightLine && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">{stats.insightLine}</p>
      )}
    </section>
  );
}
