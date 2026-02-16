'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Save, Award, Lightbulb } from 'lucide-react';

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

function formatPct(n: number | null): string {
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

export default function WeeklyReportTab() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [insights, setInsights] = useState<CategoryInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState('');

  useEffect(() => {
    const getWeekStart = () => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    };
    setWeekStart((prev) => prev || getWeekStart());
  }, []);

  useEffect(() => {
    if (!weekStart) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/admin/custom/featured/weekly-report?weekStart=${encodeURIComponent(weekStart)}`),
      fetch('/api/admin/custom/featured/category-insights?range=last30days'),
    ])
      .then(async ([resReport, resInsights]) => {
        const reportJson = await resReport.json();
        const insightsJson = await resInsights.json();
        if (cancelled) return;
        if (!resReport.ok) {
          setError(reportJson?.error || 'خطا در گزارش هفتگی');
          return;
        }
        setReport(reportJson);
        setInsights(resInsights.ok ? insightsJson : null);
      })
      .catch(() => {
        if (!cancelled) setError('خطا در دریافت داده');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  if (loading && !report) {
    return (
      <div className="flex justify-center py-12" dir="rtl">
        <p className="text-gray-500">در حال بارگذاری گزارش…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300" dir="rtl">
        {error}
      </div>
    );
  }

  const r = report!;

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">هفته از:</label>
        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
        />
      </div>

      {/* Section 1 — Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <BarChart3 className="w-4 h-4" />
            تعداد اسلات‌ها
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{r.totalSlots}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <BarChart3 className="w-4 h-4" />
            میانگین CTR
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(r.avgCTR * 100).toFixed(2)}%
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <Save className="w-4 h-4" />
            میانگین Save Lift
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {r.avgSaveLift != null ? `${r.avgSaveLift.toFixed(1)}%` : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <Award className="w-4 h-4" />
            بهترین
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white truncate" title={r.bestPerformer?.listTitle ?? '—'}>
            {r.bestPerformer?.listTitle ?? '—'}
          </p>
          {r.bestPerformer != null && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Save Lift: {r.bestPerformer.saveLiftPercent.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {/* Section 2 — Best Performer Highlight */}
      {r.bestPerformer && r.totalSlots > 0 && (
        <div className="rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-900/20 p-6">
          <h3 className="text-base font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
            بهترین لیست هفته
          </h3>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
            {r.bestPerformer.listTitle}
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
            Save Lift: +{r.bestPerformer.saveLiftPercent.toFixed(1)}%
          </p>
        </div>
      )}

      {/* Section 3 — Performance Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
          جدول عملکرد اسلات‌ها
        </h3>
        {r.slots.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">اسلاتی در این هفته ثبت نشده.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                  <th className="p-3 font-medium">لیست</th>
                  <th className="p-3 font-medium">دسته</th>
                  <th className="p-3 font-medium">CTR</th>
                  <th className="p-3 font-medium">Save Lift</th>
                  <th className="p-3 font-medium">Score Lift</th>
                  <th className="p-3 font-medium">تأثیر</th>
                </tr>
              </thead>
              <tbody>
                {r.slots.map((row) => (
                  <tr key={row.slotId} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="p-3 font-medium">{row.listTitle}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{row.categoryName ?? '—'}</td>
                    <td className="p-3">{(row.ctr * 100).toFixed(2)}%</td>
                    <td className="p-3">{formatPct(row.saveLiftPercent)}</td>
                    <td className="p-3">{formatPct(row.scoreLiftPercent)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                          row.impactLabel === 'High Impact'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : row.impactLabel === 'Moderate'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                        }`}
                      >
                        {row.impactLabel === 'High Impact'
                          ? 'تأثیر بالا'
                          : row.impactLabel === 'Moderate'
                            ? 'متوسط'
                            : 'ضعیف'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4 — Category Insights */}
      {insights && insights.categories.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            بینش دسته‌بندی (۳۰ روز اخیر)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                  <th className="p-3 font-medium">رتبه</th>
                  <th className="p-3 font-medium">دسته</th>
                  <th className="p-3 font-medium">تعداد Featured</th>
                  <th className="p-3 font-medium">میانگین CTR</th>
                  <th className="p-3 font-medium">میانگین Save Lift</th>
                  <th className="p-3 font-medium">امتیاز تأثیر</th>
                </tr>
              </thead>
              <tbody>
                {insights.categories.map((c) => (
                  <tr key={c.categoryId} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="p-3 font-medium">{c.rank}</td>
                    <td className="p-3">{c.categoryName}</td>
                    <td className="p-3">{c.featuredCount}</td>
                    <td className="p-3">{(c.avgCTR * 100).toFixed(2)}%</td>
                    <td className="p-3">{formatPct(c.avgSaveLift)}</td>
                    <td className="p-3">{c.impactScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 5 — Recommendations */}
      {(r.recommendations.length > 0 || (insights?.recommendations?.length ?? 0) > 0) && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 p-5">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium mb-3">
            <Lightbulb className="w-5 h-5" />
            پیشنهادات
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-amber-800 dark:text-amber-200">
            {r.recommendations.map((text, i) => (
              <li key={`w-${i}`}>{text}</li>
            ))}
            {insights?.recommendations?.map((text, i) => (
              <li key={`c-${i}`}>{text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
