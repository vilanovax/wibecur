'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import type { ListRuntimeDebugData } from '@/lib/admin/trending-debug-runtime';

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function TrendingDebugRuntimeContent({ listId }: { listId: string }) {
  const [data, setData] = useState<ListRuntimeDebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (bypass: boolean) => {
    const url = `/api/admin/lists/${listId}/debug${bypass ? '?bypass=1' : ''}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'خطا در دریافت');
      return;
    }
    setError(null);
    setData(json.data);
  };

  useEffect(() => {
    setLoading(true);
    fetchData(false).finally(() => setLoading(false));
  }, [listId]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    await fetchData(true);
    setRecalculating(false);
  };

  if (loading && !data) {
    return (
      <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-muted)] p-8 text-center text-[var(--color-text-muted)]">
        در حال بارگذاری...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700">
        {error || 'داده‌ای یافت نشد'}
      </div>
    );
  }

  const { rawMetrics, breakdown } = data;

  return (
    <div className="space-y-6">
      {/* SECTION 1 — Runtime Score Panel */}
      <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border-muted)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">
              {data.listTitle}
            </h1>
            {data.categoryName && (
              <p className="text-[var(--color-text-muted)] text-sm">
                دسته: {data.categoryName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate (Bypass Cache)
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Final Trending Score (runtime)</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
              {data.scoreRounded}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Position in Global Trending</p>
            <p className="text-lg font-medium text-[var(--color-text)]">
              {data.positionInGlobalTrending != null ? `#${data.positionInGlobalTrending}` : `—`}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Calculated at</p>
            <p className="text-lg font-medium text-[var(--color-text)] tabular-nums">
              {formatTime(data.calculatedAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Cache status</p>
            <p className="text-lg font-medium">
              <span className={data.cacheStatus === 'BYPASS' ? 'text-amber-600' : 'text-emerald-600'}>
                {data.cacheStatus === 'BYPASS' ? 'MISS (Bypass)' : 'HIT'}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Badge</p>
            <p className="text-sm font-medium text-[var(--color-text)]">{data.badge}</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Raw Metrics (from DB) */}
      <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border-muted)]">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          Raw Metrics (از DB)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricRow label="S7 (7d bookmarks)" value={rawMetrics.bookmarks7d} />
          <MetricRow label="C7 (7d comments)" value={rawMetrics.comments7d} />
          <MetricRow label="L7 (7d likes)" value={rawMetrics.likes7d} />
          <MetricRow label="V7 (7d views)" value={breakdown.V7} note="Not tracked" />
          <MetricRow label="24h bookmarks" value={rawMetrics.bookmarks24h} />
          <MetricRow label="daysSinceLastSave" value={rawMetrics.daysSinceLastSave} />
          <MetricRow label="AgeDays" value={rawMetrics.AgeDays} />
          <MetricRow label="saveCount (DB)" value={rawMetrics.saveCount} />
          <MetricRow label="likeCount (DB)" value={rawMetrics.likeCount} />
          <MetricRow label="createdAt" value={rawMetrics.createdAt} isDate />
          <MetricRow label="lastSaveAt" value={rawMetrics.lastSaveAt ?? '—'} isDate />
          {rawMetrics.categoryWeight != null && (
            <MetricRow label="categoryWeight" value={rawMetrics.categoryWeight} />
          )}
        </div>
      </section>

      {/* SECTION 3 — Weighted Breakdown */}
      <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border-muted)]">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-2">
          Weighted Breakdown
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4 font-mono">
          lib/trending/score.ts → calculateTrendingScore(metrics)
        </p>
        <div className="space-y-2 text-sm">
          <Row label="S7 × 4" formula={`${breakdown.S7} × 4`} result={breakdown.weighted.S7_weighted} />
          <Row label="C7 × 3" formula={`${breakdown.C7} × 3`} result={breakdown.weighted.C7_weighted} />
          <Row label="L7 × 2" formula={`${breakdown.L7} × 2`} result={breakdown.weighted.L7_weighted} />
          <Row label="V7 × 0.5" formula={`${breakdown.V7} × 0.5`} result={breakdown.weighted.V7_weighted} note={breakdown.V7 === 0 ? 'Not tracked' : undefined} />
          <Row label="SaveVelocity × 5" formula={`${breakdown.SaveVelocity.toFixed(2)} × 5`} result={breakdown.weighted.SaveVelocity_weighted} />
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <p className="text-[var(--color-text-muted)] text-sm">
            Numerator = {breakdown.numerator.toFixed(2)}
          </p>
          <p className="text-[var(--color-text-muted)] text-sm">
            Denominator = (1 + AgeDays×0.1) = {breakdown.denominator.toFixed(2)} (AgeDays = {breakdown.AgeDays})
          </p>
          <p className="mt-2 font-semibold text-[var(--color-text)]">
            Final Score = max(0, {breakdown.numerator.toFixed(2)} / {breakdown.denominator.toFixed(2)}) = {data.scoreRounded}
          </p>
        </div>
      </section>

      {/* SECTION 4 — Warnings */}
      {data.warnings.length > 0 && (
        <section className="rounded-2xl bg-amber-50 border border-amber-200 p-6">
          <h2 className="text-base font-semibold text-amber-800 mb-3">
            Warnings (Guardrails)
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.warnings.map((w, i) => (
              <span
                key={i}
                className="inline-flex px-3 py-1.5 rounded-xl text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200"
              >
                {w}
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-2">
            این هشدارها فقط اطلاعاتی‌اند و روی امتیاز اثری ندارند.
          </p>
        </section>
      )}

      {/* SECTION 5 — Comparison (Runtime-Based Position) */}
      <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border-muted)]">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-2">
          Comparison (Runtime-Based)
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Rank ذخیره نشده؛ موقعیت از آرایهٔ getFullGlobalTrendingSorted محاسبه شده.
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-[var(--color-text-muted)]">Current Position in Global Trending:</span>
          <span className="text-2xl font-bold text-[var(--primary)]">
            {data.positionInGlobalTrending != null
              ? `#${data.positionInGlobalTrending}`
              : `خارج از تاپ ${data.totalRanked}`}
          </span>
        </div>
        {data.positionInGlobalTrending != null && (
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            از {data.totalRanked} لیست (runtime index در آرایه)
          </p>
        )}
      </section>

      <div className="flex gap-2">
        <Link
          href={`/admin/lists/${listId}/edit`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
        >
          ویرایش لیست
        </Link>
        <Link
          href="/admin/lists"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text)]"
        >
          بازگشت به لیست‌ها
        </Link>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  isDate,
  note,
}: {
  label: string;
  value: number | string;
  isDate?: boolean;
  note?: string;
}) {
  const display = typeof value === 'number' ? value.toLocaleString('fa-IR') : value;
  const short = isDate && typeof value === 'string' && value.length > 20 ? value.slice(0, 19) + '…' : display;
  return (
    <div className="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border-muted)]">
      <p className="text-xs text-[var(--color-text-muted)] mb-0.5 font-mono">{label}</p>
      <p className="text-sm font-medium tabular-nums text-[var(--color-text)]">{short}</p>
      {note && <p className="text-xs text-amber-600 mt-0.5">{note}</p>}
    </div>
  );
}

function Row({
  label,
  formula,
  result,
  note,
}: {
  label: string;
  formula: string;
  result: number;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border-muted)] last:border-0">
      <span className="text-[var(--color-text-muted)]">{label}{note ? ` (${note})` : ''}</span>
      <span className="font-mono text-xs text-[var(--color-text)]">{formula}</span>
      <span className="font-semibold tabular-nums" style={{ color: 'var(--primary)' }}>
        = {result.toFixed(2)}
      </span>
    </div>
  );
}
