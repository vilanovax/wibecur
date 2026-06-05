'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Save,
  Award,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Calendar,
  Plus,
} from 'lucide-react';

type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  totalSlots: number;
  avgCTR: number;
  avgSaveLift: number | null;
  bestPerformer: { listTitle: string; listId: string; saveLiftPercent: number } | null;
  slots: {
    slotId: string;
    listTitle: string;
    listId: string;
    categoryName: string | null;
    categoryId: string | null;
    ctr: number;
    saveLiftPercent: number | null;
    scoreLiftPercent: number | null;
    impactLabel: string;
  }[];
  recommendations: string[];
};

type CategoryInsights = {
  range: string;
  start: string;
  end: string;
  categories: {
    categoryId: string;
    categoryName: string;
    featuredCount: number;
    avgCTR: number;
    avgSaveLift: number | null;
    avgScoreLift: number | null;
    impactScore: number;
    rank: number;
  }[];
  recommendations: string[];
};

type Props = {
  onGoToScheduler?: () => void;
  onAddSlot?: () => void;
};

function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatPct(n: number | null): string {
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

function impactLabelFa(label: string): string {
  if (label === 'High Impact') return 'تأثیر بالا';
  if (label === 'Moderate') return 'متوسط';
  return 'ضعیف';
}

function impactClass(label: string): string {
  if (label === 'High Impact') return 'bg-emerald-100 text-emerald-800';
  if (label === 'Moderate') return 'bg-amber-100 text-amber-800';
  return 'bg-[var(--color-bg)] text-[var(--color-text-muted)]';
}

function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="h-10 w-64 bg-[var(--color-bg)] rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-[var(--color-bg)]" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-[var(--color-bg)]" />
    </div>
  );
}

export default function WeeklyReportTab({ onGoToScheduler, onAddSlot }: Props) {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [insights, setInsights] = useState<CategoryInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState('');

  useEffect(() => {
    setWeekStart((prev) => prev || getMonday(new Date()).toISOString().slice(0, 10));
  }, []);

  const loadReport = useCallback(() => {
    if (!weekStart) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/admin/custom/featured/weekly-report?weekStart=${encodeURIComponent(weekStart)}`),
      fetch('/api/admin/custom/featured/category-insights?range=last30days'),
    ])
      .then(async ([resReport, resInsights]) => {
        const reportJson = await resReport.json();
        const insightsJson = await resInsights.json();
        if (!resReport.ok) {
          setError(reportJson?.error || 'خطا در گزارش هفتگی');
          setReport(null);
          return;
        }
        setReport(reportJson);
        setInsights(resInsights.ok ? insightsJson : null);
      })
      .catch(() => {
        setError('خطا در دریافت داده');
        setReport(null);
      })
      .finally(() => setLoading(false));
  }, [weekStart]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const shiftWeek = (delta: number) => {
    setWeekStart((prev) => addDays(prev, delta * 7));
  };

  if (loading && !report) {
    return <ReportSkeleton />;
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 text-sm"
        dir="rtl"
      >
        {error}
        <button
          type="button"
          onClick={loadReport}
          className="block mt-3 text-[var(--primary)] font-medium"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!report) return null;

  const weekEndDisplay = new Date(report.weekEnd).toLocaleDateString('fa-IR', {
    dateStyle: 'medium',
  });
  const weekStartDisplay = new Date(report.weekStart).toLocaleDateString('fa-IR', {
    dateStyle: 'medium',
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">گزارش هفتگی</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {weekStartDisplay} – {weekEndDisplay}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
            aria-label="هفته قبل"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(getMonday(new Date()).toISOString().slice(0, 10))}
            className="px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg)]"
          >
            این هفته
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
            aria-label="هفته بعد"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: BarChart3,
            label: 'اسلات‌های هفته',
            value: report.totalSlots.toLocaleString('fa-IR'),
            accent: 'from-blue-500/10 to-blue-600/5 border-blue-200/50',
          },
          {
            icon: BarChart3,
            label: 'میانگین CTR',
            value: `${(report.avgCTR * 100).toFixed(2)}٪`,
            accent: 'from-violet-500/10 to-violet-600/5 border-violet-200/50',
          },
          {
            icon: Save,
            label: 'میانگین Save Lift',
            value:
              report.avgSaveLift != null
                ? `${report.avgSaveLift.toFixed(1)}٪`
                : '—',
            accent: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50',
          },
          {
            icon: Award,
            label: 'بهترین لیست',
            value: report.bestPerformer?.listTitle ?? '—',
            sub:
              report.bestPerformer != null
                ? `+${report.bestPerformer.saveLiftPercent.toFixed(1)}٪`
                : undefined,
            accent: 'from-amber-500/10 to-amber-600/5 border-amber-200/50',
          },
        ].map(({ icon: Icon, label, value, sub, accent }) => (
          <div
            key={label}
            className={`rounded-2xl border bg-gradient-to-br ${accent} p-4 shadow-sm`}
          >
            <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)] mb-2">
              <Icon className="w-4 h-4" />
              {label}
            </div>
            <p className="text-xl font-bold text-[var(--color-text)] truncate" title={value}>
              {value}
            </p>
            {sub && (
              <p className="text-xs text-emerald-600 font-medium mt-1">{sub}</p>
            )}
          </div>
        ))}
      </div>

      {report.bestPerformer && report.totalSlots > 0 && (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-5">
          <h3 className="text-sm font-semibold text-emerald-800 mb-1">برترین عملکرد هفته</h3>
          <p className="text-lg font-bold text-emerald-900">{report.bestPerformer.listTitle}</p>
          <p className="text-sm text-emerald-700 mt-1">
            Save Lift: +{report.bestPerformer.saveLiftPercent.toFixed(1)}٪
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">عملکرد اسلات‌ها</h3>
          {report.totalSlots === 0 && onAddSlot && (
            <button
              type="button"
              onClick={onAddSlot}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] font-medium"
            >
              <Plus className="w-4 h-4" />
              زمان‌بندی اسلات
            </button>
          )}
        </div>
        {report.slots.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-10 h-10 mx-auto text-[var(--color-text-muted)] mb-3 opacity-50" />
            <p className="text-sm text-[var(--color-text-muted)]">
              در این هفته اسلاتی ثبت نشده.
            </p>
            {onGoToScheduler && (
              <button
                type="button"
                onClick={onGoToScheduler}
                className="mt-3 text-sm font-medium text-[var(--primary)] hover:underline"
              >
                رفتن به برنامه‌ریزی
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">لیست</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">دسته</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">CTR</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">Save Lift</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">Score Lift</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">تأثیر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)]">
                {report.slots.map((row) => (
                  <tr key={row.slotId} className="hover:bg-[var(--color-bg)]">
                    <td className="p-3 font-medium text-[var(--color-text)]">{row.listTitle}</td>
                    <td className="p-3 text-[var(--color-text-muted)]">
                      {row.categoryName ?? '—'}
                    </td>
                    <td className="p-3 tabular-nums">{(row.ctr * 100).toFixed(2)}٪</td>
                    <td className="p-3 tabular-nums">{formatPct(row.saveLiftPercent)}</td>
                    <td className="p-3 tabular-nums">{formatPct(row.scoreLiftPercent)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${impactClass(row.impactLabel)}`}
                      >
                        {impactLabelFa(row.impactLabel)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {insights && insights.categories.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--color-text)] px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            بینش دسته‌ها (۳۰ روز)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">رتبه</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">دسته</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">Featured</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">CTR</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">Save Lift</th>
                  <th className="p-3 font-medium text-[var(--color-text-muted)]">امتیاز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)]">
                {insights.categories.map((c) => (
                  <tr key={c.categoryId}>
                    <td className="p-3">{c.rank.toLocaleString('fa-IR')}</td>
                    <td className="p-3">{c.categoryName}</td>
                    <td className="p-3 tabular-nums">{c.featuredCount}</td>
                    <td className="p-3 tabular-nums">{(c.avgCTR * 100).toFixed(2)}٪</td>
                    <td className="p-3 tabular-nums">{formatPct(c.avgSaveLift)}</td>
                    <td className="p-3 tabular-nums">{c.impactScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(report.recommendations.length > 0 ||
        (insights?.recommendations?.length ?? 0) > 0) && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5">
          <div className="flex items-center gap-2 text-amber-900 font-medium mb-3">
            <Lightbulb className="w-5 h-5" />
            پیشنهادات هفته
          </div>
          <ul className="space-y-2 text-sm text-amber-900/90">
            {report.recommendations.map((text, i) => (
              <li key={`w-${i}`} className="flex gap-2">
                <span className="text-amber-600">•</span>
                {text}
              </li>
            ))}
            {insights?.recommendations?.map((text, i) => (
              <li key={`c-${i}`} className="flex gap-2">
                <span className="text-amber-600">•</span>
                {text}
              </li>
            ))}
          </ul>
          {onGoToScheduler && (
            <button
              type="button"
              onClick={onGoToScheduler}
              className="mt-4 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              اعمال در برنامه‌ریزی →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
