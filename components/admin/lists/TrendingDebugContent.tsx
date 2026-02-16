'use client';

import Link from 'next/link';
import type { ListTrendingDebugData, TrendingStatus } from '@/lib/admin/trending-debug';

const STATUS_CONFIG: Record<
  TrendingStatus,
  { label: string; bg: string; text: string; emoji: string }
> = {
  rising: { label: 'صعودی', bg: 'bg-emerald-100', text: 'text-emerald-800', emoji: '🟢' },
  stable: { label: 'ثابت', bg: 'bg-amber-100', text: 'text-amber-800', emoji: '🟡' },
  declining: { label: 'نزولی', bg: 'bg-red-100', text: 'text-red-800', emoji: '🔴' },
};

const RISK_CONFIG = {
  none: { label: 'ندارد', color: 'text-[var(--color-text-muted)]' },
  low: { label: 'کم', color: 'text-emerald-600' },
  medium: { label: 'متوسط', color: 'text-amber-600' },
  high: { label: 'بالا', color: 'text-red-600' },
} as const;

export default function TrendingDebugContent({ data }: { data: ListTrendingDebugData }) {
  const statusConf = STATUS_CONFIG[data.status];
  const { scoreBreakdown, rawMetrics, prevRank, nextRank, flags } = data;

  return (
    <div className="space-y-6">
      {/* SECTION 1 — Header */}
      <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border-muted)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">
              {data.list.title}
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm">
              دسته: {data.categoryName}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${statusConf.bg} ${statusConf.text}`}
          >
            <span>{statusConf.emoji}</span>
            <span>{statusConf.label}</span>
          </span>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">رتبه فعلی</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">
              {data.currentRank != null ? `#${data.currentRank}` : `>${data.totalRanked}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">امتیاز نهایی</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
              {scoreBreakdown.finalScore}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Score Breakdown */}
      <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border-muted)]">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          تجزیه امتیاز
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-right py-3 px-2 font-medium text-[var(--color-text-muted)]">
                  جزء
                </th>
                <th className="text-right py-3 px-2 font-medium text-[var(--color-text-muted)]">
                  مقدار
                </th>
                <th className="text-right py-3 px-2 font-medium text-[var(--color-text-muted)]">
                  فرمول
                </th>
                <th className="text-right py-3 px-2 font-medium text-[var(--color-text-muted)]">
                  نتیجه
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--color-border-muted)]">
                <td className="py-3 px-2 text-[var(--color-text)]">ذخیره (Base)</td>
                <td className="py-3 px-2 font-mono">{rawMetrics.totalSaves}</td>
                <td className="py-3 px-2 font-mono text-[var(--color-text-muted)]">
                  {scoreBreakdown.formula.base}
                </td>
                <td className="py-3 px-2 font-semibold">{scoreBreakdown.baseScore}</td>
              </tr>
              <tr className="border-b border-[var(--color-border-muted)]">
                <td className="py-3 px-2 text-[var(--color-text)]">سرعت ۲۴h</td>
                <td className="py-3 px-2 font-mono">{rawMetrics.saves24h}</td>
                <td className="py-3 px-2 font-mono text-[var(--color-text-muted)]">
                  {scoreBreakdown.formula.velocity}
                </td>
                <td className="py-3 px-2 font-semibold text-emerald-600">
                  +{scoreBreakdown.velocityScore}
                </td>
              </tr>
              <tr className="border-b border-[var(--color-border-muted)]">
                <td className="py-3 px-2 text-[var(--color-text)]">بونوس تازگی</td>
                <td className="py-3 px-2">—</td>
                <td className="py-3 px-2 font-mono text-[var(--color-text-muted)] text-xs">
                  {scoreBreakdown.formula.recency}
                </td>
                <td className="py-3 px-2 font-semibold text-emerald-600">
                  +{scoreBreakdown.recencyBoost}
                </td>
              </tr>
              <tr className="border-b border-[var(--color-border-muted)]">
                <td className="py-3 px-2 text-[var(--color-text)]">کاهش (Decay)</td>
                <td className="py-3 px-2 font-mono">{rawMetrics.ageDays} روز</td>
                <td className="py-3 px-2 font-mono text-[var(--color-text-muted)]">
                  {scoreBreakdown.formula.decay}
                </td>
                <td className="py-3 px-2 font-semibold text-red-600">
                  -{scoreBreakdown.decay}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
          <span className="text-[var(--color-text-muted)]">امتیاز پایه:</span>
          <span className="font-mono font-semibold">{scoreBreakdown.baseScore}</span>
          <span className="text-[var(--color-text-muted)]">سرعت:</span>
          <span className="font-mono font-semibold text-emerald-600">
            +{scoreBreakdown.velocityScore}
          </span>
          <span className="text-[var(--color-text-muted)]">تازگی:</span>
          <span className="font-mono font-semibold text-emerald-600">
            +{scoreBreakdown.recencyBoost}
          </span>
          <span className="text-[var(--color-text-muted)]">کاهش:</span>
          <span className="font-mono font-semibold text-red-600">
            -{scoreBreakdown.decay}
          </span>
          <span className="mr-auto font-bold text-[var(--primary)] text-base">
            امتیاز نهایی: {scoreBreakdown.finalScore}
          </span>
        </div>
      </section>

      {/* SECTION 3 — Raw Metrics */}
      <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border-muted)]">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          متریک‌های خام
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricCard label="ذخیره کل" value={rawMetrics.totalSaves} />
          <MetricCard label="ذخیره ۲۴ ساعت" value={rawMetrics.saves24h} />
          <MetricCard label="ذخیره ۷ روز" value={rawMetrics.saves7d} />
          <MetricCard label="سن (روز)" value={rawMetrics.ageDays} />
          <MetricCard label="وزن دسته" value={rawMetrics.categoryWeight} />
          <MetricCard
            label="نسبت درگیری (٪)"
            value={rawMetrics.engagementRatio}
            suffix="٪"
          />
        </div>
      </section>

      {/* SECTION 4 — Rank Comparison */}
      <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border-muted)]">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          مقایسه رتبه
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          {prevRank && (
            <Link
              href={`/admin/lists/${prevRank.id}/debug`}
              className="flex-1 min-w-[200px] p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--primary)] hover:bg-[var(--gray-50)] transition-colors"
            >
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                رتبه {prevRank.rank}
              </p>
              <p className="font-medium text-[var(--color-text)] truncate">
                {prevRank.title}
              </p>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--primary)' }}>
                {prevRank.finalScore}
              </p>
            </Link>
          )}
          <div className="flex-1 min-w-[200px] p-4 rounded-xl border-2 border-[var(--primary)] bg-[var(--gray-50)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">
              رتبه {data.currentRank ?? '—'} ← این لیست
            </p>
            <p className="font-medium text-[var(--color-text)] truncate">
              {data.list.title}
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: 'var(--primary)' }}>
              {scoreBreakdown.finalScore}
            </p>
          </div>
          {nextRank && (
            <Link
              href={`/admin/lists/${nextRank.id}/debug`}
              className="flex-1 min-w-[200px] p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--primary)] hover:bg-[var(--gray-50)] transition-colors"
            >
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                رتبه {nextRank.rank}
              </p>
              <p className="font-medium text-[var(--color-text)] truncate">
                {nextRank.title}
              </p>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--primary)' }}>
                {nextRank.finalScore}
              </p>
            </Link>
          )}
        </div>
        {!prevRank && !nextRank && data.currentRank != null && (
          <p className="text-sm text-[var(--color-text-muted)]">
            فقط این لیست در نمونه رتبه‌بندی حاضر است.
          </p>
        )}
      </section>

      {/* SECTION 5 — Flags */}
      <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--color-border-muted)]">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          پرچم‌ها و ریسک
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FlagRow
            label="تقویت دستی (Boost)"
            value={flags.boostActive ? 'بله' : 'خیر'}
            active={flags.boostActive}
          />
          <FlagRow
            label="جهش ذخیره (Spike)"
            value={flags.saveSpikeDetected ? 'بله' : 'خیر'}
            active={flags.saveSpikeDetected}
          />
          <FlagRow
            label="Override دستی"
            value={flags.manualOverride ? 'بله' : 'خیر'}
            active={flags.manualOverride}
          />
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-1">سطح ریسک</p>
            <p className={`font-medium ${RISK_CONFIG[flags.riskLevel].color}`}>
              {RISK_CONFIG[flags.riskLevel].label}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix = '',
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--color-border-muted)]">
      <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-xl font-bold text-[var(--color-text)] font-mono">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function FlagRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-[var(--color-text-muted)] mb-1">{label}</p>
      <p
        className={`font-medium ${active ? 'text-amber-600' : 'text-[var(--color-text)]'}`}
      >
        {value}
      </p>
    </div>
  );
}
