'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Calendar,
  Plus,
  Loader2,
} from 'lucide-react';
import type { WeeklyReport, CategoryInsights } from './featured-weekly-types';
import {
  formatPct,
  getMonday,
  impactClass,
  impactLabelFa,
} from './featured-weekly-types';

type Props = {
  onAddSlot?: () => void;
  refreshKey?: number;
  defaultOpen?: boolean;
};

export default function FeaturedWeeklyDetails({
  onAddSlot,
  refreshKey = 0,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [insights, setInsights] = useState<CategoryInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState('');

  useEffect(() => {
    setWeekStart((prev) => prev || getMonday(new Date()).toISOString().slice(0, 10));
  }, []);

  const load = useCallback(() => {
    if (!weekStart || !open) return;
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
          setError(reportJson?.error || 'خطا در گزارش');
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
  }, [weekStart, open]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    setWeekStart(getMonday(new Date()).toISOString().slice(0, 10));
  }, [refreshKey]);

  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm"
      dir="rtl"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-[var(--color-bg)]/80 transition-colors"
      >
        <span className="text-sm font-semibold text-[var(--color-text)]">
          جزئیات عملکرد هفتگی و دسته‌ها
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
        )}
      </button>

      {open && (
        <div className="border-t border-[var(--color-border)] px-4 sm:px-5 pb-5 space-y-5">
          {loading && !report && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 py-4">
              {error}
              <button type="button" onClick={load} className="block mt-2 text-[var(--primary)]">
                تلاش مجدد
              </button>
            </p>
          )}
          {report && (
            <>
              {report.bestPerformer && report.totalSlots > 0 && (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4">
                  <h3 className="text-sm font-semibold text-emerald-800">برترین عملکرد هفته</h3>
                  <p className="text-base font-bold text-emerald-900 mt-1">
                    {report.bestPerformer.listTitle}
                  </p>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    Save Lift: +{report.bestPerformer.saveLiftPercent.toFixed(1)}٪
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    عملکرد اسلات‌ها
                  </h3>
                  {report.totalSlots === 0 && onAddSlot && (
                    <button
                      type="button"
                      onClick={onAddSlot}
                      className="inline-flex items-center gap-1 text-xs text-[var(--primary)] font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      زمان‌بندی اسلات
                    </button>
                  )}
                </div>
                {report.slots.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    در این هفته اسلاتی ثبت نشده.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right min-w-[520px]">
                      <thead>
                        <tr className="border-b border-[var(--color-border)]">
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">لیست</th>
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">دسته</th>
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">CTR</th>
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">Save Lift</th>
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">تأثیر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-muted)]">
                        {report.slots.map((row) => (
                          <tr key={row.slotId} className="hover:bg-[var(--color-bg)]">
                            <td className="p-2.5 font-medium">{row.listTitle}</td>
                            <td className="p-2.5 text-[var(--color-text-muted)]">
                              {row.categoryName ?? '—'}
                            </td>
                            <td className="p-2.5 tabular-nums">
                              {(row.ctr * 100).toFixed(2)}٪
                            </td>
                            <td className="p-2.5 tabular-nums">
                              {formatPct(row.saveLiftPercent)}
                            </td>
                            <td className="p-2.5">
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
                <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <h3 className="text-sm font-semibold px-3 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                    عملکرد دسته‌ها (۳۰ روز)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right min-w-[480px]">
                      <thead>
                        <tr className="border-b border-[var(--color-border)]">
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">رتبه</th>
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">دسته</th>
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">منتخب</th>
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">CTR</th>
                          <th className="p-2.5 font-medium text-[var(--color-text-muted)]">Save Lift</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-muted)]">
                        {insights.categories.map((c) => (
                          <tr key={c.categoryId}>
                            <td className="p-2.5">{c.rank.toLocaleString('fa-IR')}</td>
                            <td className="p-2.5">{c.categoryName}</td>
                            <td className="p-2.5 tabular-nums">{c.featuredCount}</td>
                            <td className="p-2.5 tabular-nums">
                              {(c.avgCTR * 100).toFixed(2)}٪
                            </td>
                            <td className="p-2.5 tabular-nums">{formatPct(c.avgSaveLift)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(report.recommendations.length > 0 ||
                (insights?.recommendations?.length ?? 0) > 0) && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2 text-amber-900 font-medium mb-2 text-sm">
                    <Lightbulb className="w-4 h-4" />
                    پیشنهادات برنامه‌ریزی
                  </div>
                  <ul className="space-y-1.5 text-sm text-amber-900/90">
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
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
