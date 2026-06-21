'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HardDrive,
  ImageOff,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  Square,
  Star,
  Zap,
} from 'lucide-react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-intelligence';
import type {
  CoverAuditSummary,
  CoverUrgency,
  ListCoverField,
  ListCoverImageAudit,
} from '@/lib/admin/list-cover-audit-shared';
import {
  formatCoverBytes,
  isUrgentAudit,
  URGENCY_RANK,
} from '@/lib/admin/list-cover-audit-shared';
import ListCardMoreMenu from './ListCardMoreMenu';

export type ListAdminViewMode = 'grid' | 'table' | 'covers';

type CoverSort = 'urgency' | 'bytes_desc' | 'bytes_asc' | 'width_desc' | 'height_desc';
type AuditFilter = 'all' | 'urgent' | 'missing' | 'optimizable';

type Props = {
  rows: ListIntelligenceRow[];
  onFeatureToggle?: (id: string, isFeatured: boolean) => void;
  onDisableToggle?: (id: string, isActive: boolean) => void;
  onMoveToTrash?: (row: ListIntelligenceRow) => void;
  onOptimized?: () => void;
};

function slotKey(listId: string, field: ListCoverField) {
  return `${listId}:${field}`;
}

const URGENCY_STYLE: Record<CoverUrgency, string> = {
  critical: 'bg-red-500/90 text-white',
  high: 'bg-orange-500/90 text-white',
  medium: 'bg-amber-500/90 text-white',
  low: 'bg-sky-500/90 text-white',
  none: 'bg-emerald-500/90 text-white',
};

const URGENCY_BORDER: Record<CoverUrgency, string> = {
  critical: 'border-r-red-500',
  high: 'border-r-orange-500',
  medium: 'border-r-amber-500',
  low: 'border-r-sky-400',
  none: 'border-r-emerald-400',
};

const URGENCY_LABEL: Record<CoverUrgency, string> = {
  critical: 'بدون تصویر',
  high: 'فوری',
  medium: 'نیاز به بهینه‌سازی',
  low: 'قابل فشرده‌سازی',
  none: 'مناسب',
};

const URGENCY_CHIP: Record<CoverUrgency, string> = {
  critical: 'bg-red-50 text-red-800 border-red-200',
  high: 'bg-orange-50 text-orange-800 border-orange-200',
  medium: 'bg-amber-50 text-amber-900 border-amber-200',
  low: 'bg-sky-50 text-sky-800 border-sky-200',
  none: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

function maxUrgency(a?: ListCoverImageAudit, b?: ListCoverImageAudit): CoverUrgency {
  const rank = (u?: CoverUrgency) => (u ? URGENCY_RANK[u] : 0);
  const va = a?.urgency;
  const vb = b?.urgency;
  if (rank(va) >= rank(vb)) return va ?? vb ?? 'none';
  return vb ?? va ?? 'none';
}

function bytesRatio(audit: ListCoverImageAudit): number {
  if (audit.bytes == null || audit.maxBytes <= 0) return 0;
  return Math.min(1, audit.bytes / audit.maxBytes);
}

function bytesBarTone(ratio: number): string {
  if (ratio > 1.5) return 'bg-red-500';
  if (ratio > 1) return 'bg-orange-500';
  if (ratio > 0.75) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function CoverPanel({
  audit,
  row,
  aspectClass,
  emptyHint,
  selected,
  onToggleSelect,
  optimizing,
}: {
  audit: ListCoverImageAudit | undefined;
  row: ListIntelligenceRow;
  aspectClass: string;
  emptyHint: string;
  selected: boolean;
  onToggleSelect: () => void;
  optimizing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const src = audit?.url ?? null;
  const label = audit?.field === 'horizontalImage' ? 'بنر افقی' : 'کاور عمودی';
  const selectable = Boolean(audit?.optimizable);
  const ratio = audit ? bytesRatio(audit) : 0;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-[var(--color-text)]">{label}</p>
        {audit ? (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${URGENCY_CHIP[audit.urgency]}`}
          >
            {URGENCY_LABEL[audit.urgency]}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        disabled={!selectable || optimizing}
        onClick={() => selectable && onToggleSelect()}
        className={`group relative w-full text-right rounded-xl transition-all ${
          selectable ? 'cursor-pointer' : 'cursor-default'
        } ${selected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[var(--color-surface)]' : ''}`}
      >
        <div
          className={`relative w-full overflow-hidden rounded-xl border bg-[var(--color-bg)] ${aspectClass} ${
            audit && isUrgentAudit(audit)
              ? 'border-amber-300/80'
              : 'border-[var(--color-border-muted)]'
          } ${selectable ? 'group-hover:border-violet-300' : ''}`}
        >
          {src ? (
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
            <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 p-4 text-center bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-surface)]">
              <ImageOff className="w-8 h-8 text-[var(--color-text-muted)]/50" />
              <span className="text-xs text-[var(--color-text-muted)]">{emptyHint}</span>
            </div>
          )}

          {audit ? (
            <span
              className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm backdrop-blur-sm ${URGENCY_STYLE[audit.urgency]}`}
            >
              {URGENCY_LABEL[audit.urgency]}
            </span>
          ) : null}

          {selectable ? (
            <span
              className={`absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                selected
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-white/90 border-white/90 text-transparent group-hover:border-violet-300'
              }`}
            >
              {selected ? '✓' : ''}
            </span>
          ) : null}

          {optimizing ? (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <span className="text-[11px] text-white/90">در حال بهینه‌سازی…</span>
            </div>
          ) : null}
        </div>
      </button>

      {audit ? (
        <div className="mt-2.5 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tabular-nums text-[var(--color-text-muted)]">
            {audit.width != null && audit.height != null ? (
              <span>
                {audit.width}×{audit.height}
                <span className="mx-1 opacity-40">/</span>
                <span className="text-[var(--color-text)]/70">
                  {audit.maxWidth}×{audit.maxHeight}
                </span>
              </span>
            ) : null}
            {audit.bytes != null ? (
              <span>
                {formatCoverBytes(audit.bytes)}
                <span className="mx-1 opacity-40">/</span>
                <span className="text-[var(--color-text)]/70">{formatCoverBytes(audit.maxBytes)}</span>
              </span>
            ) : null}
            {!audit.onStorage && audit.url ? (
              <span className="text-orange-700 font-medium">خارج از استوریج</span>
            ) : null}
          </div>

          {audit.bytes != null ? (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-[var(--color-border-muted)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${bytesBarTone(ratio)}`}
                  style={{ width: `${Math.min(100, ratio * 100)}%` }}
                />
              </div>
              {ratio > 1 ? (
                <p className="text-[10px] text-orange-700">
                  {Math.round((ratio - 1) * 100).toLocaleString('fa-IR')}٪ بیشتر از هدف
                </p>
              ) : null}
            </div>
          ) : null}

          {audit.issues.length > 0 ? (
            <div>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                {audit.issues[0]}
              </p>
              {audit.issues.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-[var(--primary)] hover:underline"
                >
                  {expanded ? (
                    <>
                      کمتر
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      {audit.issues.length - 1} مورد دیگر
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              ) : null}
              {expanded ? (
                <ul className="mt-1 text-[10px] text-[var(--color-text-muted)] space-y-0.5 list-disc list-inside">
                  {audit.issues.slice(1).map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AuditSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-pulse">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] overflow-hidden"
        >
          <div className="h-14 bg-[var(--color-bg)]/60 border-b border-[var(--color-border-muted)]" />
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] rounded-xl bg-[var(--color-bg)]" />
            <div className="aspect-[16/9] rounded-xl bg-[var(--color-bg)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ListCoversGallery({
  rows,
  onFeatureToggle,
  onDisableToggle,
  onMoveToTrash,
  onOptimized,
}: Props) {
  const [audits, setAudits] = useState<ListCoverImageAudit[]>([]);
  const [summary, setSummary] = useState<CoverAuditSummary | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<CoverSort>('urgency');
  const [filter, setFilter] = useState<AuditFilter>('all');
  const [urgentQueueOpen, setUrgentQueueOpen] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [optimizing, setOptimizing] = useState(false);
  const [optimizingKeys, setOptimizingKeys] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null);

  const auditMap = useMemo(() => {
    const map = new Map<string, ListCoverImageAudit>();
    for (const a of audits) map.set(slotKey(a.listId, a.field), a);
    return map;
  }, [audits]);

  const healthScore = useMemo(() => {
    if (audits.length === 0) return null;
    const healthy = audits.filter((a) => URGENCY_RANK[a.urgency] <= URGENCY_RANK.low).length;
    return Math.round((healthy / audits.length) * 100);
  }, [audits]);

  const loadAudit = useCallback(async () => {
    if (rows.length === 0) {
      setAudits([]);
      setSummary(null);
      return;
    }
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const res = await fetch('/api/admin/lists/cover-audit/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listIds: rows.map((r) => r.id) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا در بررسی تصاویر');
      setAudits(json.items as ListCoverImageAudit[]);
      setSummary(json.summary as CoverAuditSummary);
      setSelected(new Set());
    } catch (err: unknown) {
      setAuditError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoadingAudit(false);
    }
  }, [rows]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const rowMatchesFilter = useCallback(
    (row: ListIntelligenceRow) => {
      const v = auditMap.get(slotKey(row.id, 'coverImage'));
      const h = auditMap.get(slotKey(row.id, 'horizontalImage'));
      const slots = [v, h].filter(Boolean) as ListCoverImageAudit[];
      if (slots.length === 0) return filter === 'all';

      switch (filter) {
        case 'urgent':
          return slots.some((s) => isUrgentAudit(s));
        case 'missing':
          return slots.some((s) => s.urgency === 'critical');
        case 'optimizable':
          return slots.some((s) => s.optimizable);
        default:
          return true;
      }
    },
    [auditMap, filter]
  );

  const sortedRows = useMemo(() => {
    const rowScores = new Map<string, number>();
    for (const row of rows) {
      const vertical = auditMap.get(slotKey(row.id, 'coverImage'));
      const horizontal = auditMap.get(slotKey(row.id, 'horizontalImage'));
      const maxU = Math.max(
        vertical ? URGENCY_RANK[vertical.urgency] : 0,
        horizontal ? URGENCY_RANK[horizontal.urgency] : 0
      );
      const maxBytes = Math.max(vertical?.bytes ?? 0, horizontal?.bytes ?? 0);
      const maxWidth = Math.max(vertical?.width ?? 0, horizontal?.width ?? 0);
      const maxHeight = Math.max(vertical?.height ?? 0, horizontal?.height ?? 0);
      rowScores.set(row.id, maxU * 1e12 + maxBytes * 100 + maxWidth + maxHeight * 0.01);
    }

    let list = rows.filter(rowMatchesFilter);

    switch (sortBy) {
      case 'bytes_desc':
        return list.sort(
          (a, b) =>
            Math.max(auditMap.get(slotKey(b.id, 'coverImage'))?.bytes ?? 0, auditMap.get(slotKey(b.id, 'horizontalImage'))?.bytes ?? 0) -
            Math.max(auditMap.get(slotKey(a.id, 'coverImage'))?.bytes ?? 0, auditMap.get(slotKey(a.id, 'horizontalImage'))?.bytes ?? 0)
        );
      case 'bytes_asc':
        return list.sort(
          (a, b) =>
            Math.max(auditMap.get(slotKey(a.id, 'coverImage'))?.bytes ?? 0, auditMap.get(slotKey(a.id, 'horizontalImage'))?.bytes ?? 0) -
            Math.max(auditMap.get(slotKey(b.id, 'coverImage'))?.bytes ?? 0, auditMap.get(slotKey(b.id, 'horizontalImage'))?.bytes ?? 0)
        );
      case 'width_desc':
        return list.sort(
          (a, b) =>
            Math.max(auditMap.get(slotKey(b.id, 'coverImage'))?.width ?? 0, auditMap.get(slotKey(b.id, 'horizontalImage'))?.width ?? 0) -
            Math.max(auditMap.get(slotKey(a.id, 'coverImage'))?.width ?? 0, auditMap.get(slotKey(a.id, 'horizontalImage'))?.width ?? 0)
        );
      case 'height_desc':
        return list.sort(
          (a, b) =>
            Math.max(auditMap.get(slotKey(b.id, 'coverImage'))?.height ?? 0, auditMap.get(slotKey(b.id, 'horizontalImage'))?.height ?? 0) -
            Math.max(auditMap.get(slotKey(a.id, 'coverImage'))?.height ?? 0, auditMap.get(slotKey(a.id, 'horizontalImage'))?.height ?? 0)
        );
      default:
        return list.sort((a, b) => (rowScores.get(b.id) ?? 0) - (rowScores.get(a.id) ?? 0));
    }
  }, [rows, auditMap, sortBy, rowMatchesFilter]);

  const urgentItems = useMemo(() => audits.filter((a) => isUrgentAudit(a)), [audits]);

  const toggleSelect = (listId: string, field: ListCoverField) => {
    const key = slotKey(listId, field);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllOptimizable = () => {
    setSelected(new Set(audits.filter((a) => a.optimizable).map((a) => slotKey(a.listId, a.field))));
  };

  const selectAllUrgent = () => {
    setSelected(
      new Set(audits.filter((a) => a.optimizable && isUrgentAudit(a)).map((a) => slotKey(a.listId, a.field)))
    );
  };

  const runBulkOptimize = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`بهینه‌سازی ${selected.size.toLocaleString('fa-IR')} تصویر در استوریج؟`)) return;

    setOptimizing(true);
    setMessage(null);
    const keys = [...selected];
    setOptimizingKeys(new Set(keys));

    try {
      const slots = keys.map((key) => {
        const [listId, field] = key.split(':') as [string, ListCoverField];
        return { listId, field };
      });

      const res = await fetch('/api/admin/lists/cover-audit/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'خطا');

      setMessage({ text: json.message || 'بهینه‌سازی انجام شد', tone: 'ok' });
      setSelected(new Set());
      await loadAudit();
      onOptimized?.();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'خطا', tone: 'err' });
    } finally {
      setOptimizing(false);
      setOptimizingKeys(new Set());
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-sm text-[var(--color-text-muted)]">
        لیستی برای نمایش کاورها نیست.
      </div>
    );
  }

  const filterPills: { id: AuditFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'همه', count: rows.length },
    { id: 'urgent', label: 'فوری', count: summary?.urgent },
    { id: 'missing', label: 'بدون تصویر', count: summary?.missing },
    { id: 'optimizable', label: 'قابل بهینه‌سازی', count: summary?.optimizable },
  ];

  return (
    <div className="space-y-4">
      {/* Dashboard header */}
      <section className="rounded-2xl border border-[var(--color-border-muted)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg)]/30 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--color-border-muted)]/80">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 text-violet-700">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-text)]">ممیزی تصاویر استوریج</h2>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    بررسی حجم، ابعاد و بهینه‌سازی کاورهای لیست در ParsPack
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadAudit()}
              disabled={loadingAudit || optimizing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
          </div>

          {summary ? (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <StatCard icon={HardDrive} label="کل اسلات" value={summary.totalSlots} />
              <StatCard icon={AlertTriangle} label="فوری" value={summary.urgent} tone="urgent" />
              <StatCard icon={ImageOff} label="بدون تصویر" value={summary.missing} tone="danger" />
              <StatCard icon={Zap} label="قابل بهینه‌سازی" value={summary.optimizable} tone="action" />
              <StatCard icon={HardDrive} label="حجم کل" value={formatCoverBytes(summary.totalBytes)} raw />
            </div>
          ) : loadingAudit ? (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-[var(--color-bg)]" />
              ))}
            </div>
          ) : null}

          {healthScore != null ? (
            <div className="mt-4 rounded-xl bg-[var(--color-bg)]/60 border border-[var(--color-border-muted)] p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-[var(--color-text)]">سلامت کلی تصاویر</span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    healthScore >= 80 ? 'text-emerald-700' : healthScore >= 50 ? 'text-amber-700' : 'text-red-700'
                  }`}
                >
                  {healthScore.toLocaleString('fa-IR')}٪
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-border-muted)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 50 ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Toolbar */}
        <div className="px-4 sm:px-5 py-3 space-y-3 bg-[var(--color-surface)]/50">
          <div className="flex flex-wrap items-center gap-2">
            {filterPills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilter(pill.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filter === pill.id
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-violet-300'
                }`}
              >
                {pill.label}
                {pill.count != null ? (
                  <span
                    className={`tabular-nums px-1.5 py-px rounded-full text-[10px] ${
                      filter === pill.id ? 'bg-white/20' : 'bg-[var(--color-bg)]'
                    }`}
                  >
                    {pill.count.toLocaleString('fa-IR')}
                  </span>
                ) : null}
              </button>
            ))}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as CoverSort)}
              className="mr-auto px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs"
            >
              <option value="urgency">اولویت رسیدگی</option>
              <option value="bytes_desc">بیشترین حجم</option>
              <option value="bytes_asc">کمترین حجم</option>
              <option value="width_desc">بیشترین عرض</option>
              <option value="height_desc">بیشترین ارتفاع</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAllUrgent}
              className="text-[var(--primary)] hover:underline font-medium"
            >
              انتخاب همه فوری
            </button>
            <span className="text-[var(--color-border)]">·</span>
            <button
              type="button"
              onClick={selectAllOptimizable}
              className="text-[var(--primary)] hover:underline font-medium"
            >
              انتخاب همه قابل بهینه‌سازی
            </button>
            {filter !== 'all' ? (
              <>
                <span className="text-[var(--color-border)]">·</span>
                <span className="text-[var(--color-text-muted)]">
                  {sortedRows.length.toLocaleString('fa-IR')} لیست نمایش داده می‌شود
                </span>
              </>
            ) : null}
          </div>

          {auditError ? (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{auditError}</p>
          ) : null}

          {message ? (
            <p
              className={`text-xs rounded-lg px-3 py-2 border flex items-center gap-1.5 ${
                message.tone === 'ok'
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-100'
                  : 'text-red-800 bg-red-50 border-red-100'
              }`}
            >
              {message.tone === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : null}
              {message.text}
            </p>
          ) : null}

          {urgentItems.length > 0 ? (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setUrgentQueueOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-right hover:bg-amber-50 transition-colors"
              >
                <span className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  صف رسیدگی فوری
                  <span className="font-normal text-amber-800/80">
                    ({urgentItems.length.toLocaleString('fa-IR')} تصویر)
                  </span>
                </span>
                {urgentQueueOpen ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-amber-700" />}
              </button>
              {urgentQueueOpen ? (
                <ul className="px-3 pb-3 space-y-1 max-h-32 overflow-y-auto border-t border-amber-200/60">
                  {urgentItems.map((a) => (
                    <li
                      key={slotKey(a.listId, a.field)}
                      className="flex items-center justify-between gap-2 text-[11px] text-amber-950/90 py-1"
                    >
                      <span className="truncate">
                        <span className="font-medium">{a.listTitle}</span>
                        <span className="text-amber-800/70"> — {a.fieldLabel}</span>
                      </span>
                      {a.bytes != null ? (
                        <span className="shrink-0 tabular-nums text-amber-800/80">{formatCoverBytes(a.bytes)}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {loadingAudit && audits.length === 0 ? (
        <AuditSkeleton />
      ) : sortedRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-10 text-center text-sm text-[var(--color-text-muted)]">
          با فیلتر فعلی لیستی یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sortedRows.map((row) => {
            const editHref = `/admin/lists/${row.id}/edit`;
            const siteHref = `/lists/${row.slug}`;
            const verticalAudit = auditMap.get(slotKey(row.id, 'coverImage'));
            const horizontalAudit = auditMap.get(slotKey(row.id, 'horizontalImage'));
            const rowUrgency = maxUrgency(verticalAudit, horizontalAudit);

            return (
              <article
                key={row.id}
                className={`rounded-2xl border-r-4 bg-[var(--color-surface)] overflow-hidden shadow-[var(--shadow-card)] ${URGENCY_BORDER[rowUrgency]} ${
                  row.isFeatured
                    ? 'border border-amber-400/60 ring-1 ring-amber-300/30'
                    : 'border border-[var(--color-border-muted)] border-r-4'
                } ${!row.isActive ? 'opacity-75' : ''}`}
              >
                <div className="px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-bg)]/30">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
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
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${URGENCY_CHIP[rowUrgency]}`}
                    >
                      {URGENCY_LABEL[rowUrgency]}
                    </span>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CoverPanel
                    audit={verticalAudit}
                    row={row}
                    aspectClass="aspect-[3/4] max-h-72"
                    emptyHint="کاور عمودی تنظیم نشده"
                    selected={selected.has(slotKey(row.id, 'coverImage'))}
                    onToggleSelect={() => toggleSelect(row.id, 'coverImage')}
                    optimizing={optimizingKeys.has(slotKey(row.id, 'coverImage'))}
                  />
                  <CoverPanel
                    audit={horizontalAudit}
                    row={row}
                    aspectClass="aspect-[16/9] max-h-44 sm:max-h-none"
                    emptyHint="بنر افقی تنظیم نشده"
                    selected={selected.has(slotKey(row.id, 'horizontalImage'))}
                    onToggleSelect={() => toggleSelect(row.id, 'horizontalImage')}
                    optimizing={optimizingKeys.has(slotKey(row.id, 'horizontalImage'))}
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
      )}

      {selected.size > 0 ? (
        <div className="sticky bottom-4 z-20 mx-auto max-w-2xl rounded-2xl border border-violet-200/80 bg-violet-950/95 backdrop-blur-md shadow-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
          <div>
            <p className="text-sm font-semibold">
              {selected.size.toLocaleString('fa-IR')} تصویر انتخاب شده
            </p>
            <p className="text-[11px] text-violet-200/80 mt-0.5">فشرده‌سازی و ذخیره مجدد در ParsPack</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={optimizing}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs border border-violet-400/40 text-violet-100 hover:bg-violet-900/50 disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5" />
              لغو
            </button>
            <button
              type="button"
              onClick={() => void runBulkOptimize()}
              disabled={optimizing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-violet-950 hover:bg-violet-50 disabled:opacity-50"
            >
              {optimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              بهینه‌سازی
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  raw,
}: {
  icon: typeof HardDrive;
  label: string;
  value: number | string;
  tone?: 'urgent' | 'danger' | 'action';
  raw?: boolean;
}) {
  const display = raw ? value : typeof value === 'number' ? value.toLocaleString('fa-IR') : value;
  const toneCls =
    tone === 'urgent'
      ? 'border-amber-200 bg-amber-50/80'
      : tone === 'danger'
        ? 'border-red-200 bg-red-50/80'
        : tone === 'action'
          ? 'border-violet-200 bg-violet-50/80'
          : 'border-[var(--color-border-muted)] bg-[var(--color-bg)]/40';

  const iconCls =
    tone === 'urgent'
      ? 'text-amber-600'
      : tone === 'danger'
        ? 'text-red-600'
        : tone === 'action'
          ? 'text-violet-600'
          : 'text-[var(--color-text-muted)]';

  return (
    <div className={`rounded-xl border p-3 ${toneCls}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 shrink-0 ${iconCls}`} />
        <span className="text-lg font-bold tabular-nums text-[var(--color-text)] leading-none">{display}</span>
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">{label}</p>
    </div>
  );
}
