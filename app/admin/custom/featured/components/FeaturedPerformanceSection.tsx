'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Save, TrendingUp, Lightbulb } from 'lucide-react';

type Performance = {
  impressions: number;
  clicks: number;
  ctr: number;
  savesDuring: number;
  baselineSaves: number | null;
  saveLiftPercent: number | null;
  baselineScore: number | null;
  peakScore: number | null;
  scoreLiftPercent: number | null;
};

type Props = {
  slotId: string;
  onRefresh?: () => void;
};

function formatNum(n: number | null): string {
  if (n == null) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function ctrColor(ctr: number): string {
  if (ctr >= 0.18) return 'text-emerald-600 dark:text-emerald-400';
  if (ctr >= 0.05) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function liftColor(lift: number | null): string {
  if (lift == null) return 'text-gray-500';
  if (lift >= 200) return 'text-emerald-600 dark:text-emerald-400';
  if (lift >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export default function FeaturedPerformanceSection({ slotId }: Props) {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/custom/featured/${slotId}/performance`)
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok && json?.error) {
          setError(json.error);
          return;
        }
        setPerformance(json.performance ?? null);
        setRecommendations(Array.isArray(json.recommendations) ? json.recommendations : []);
      })
      .catch(() => {
        if (!cancelled) setError('خطا در دریافت آمار');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slotId]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm" dir="rtl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">عملکرد منتخب</h2>
        <p className="text-sm text-gray-500">در حال بارگذاری…</p>
      </section>
    );
  }

  if (error || !performance) {
    return (
      <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm" dir="rtl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">عملکرد منتخب</h2>
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'داده‌ای یافت نشد'}</p>
      </section>
    );
  }

  const { ctr, saveLiftPercent, scoreLiftPercent } = performance;

  return (
    <section className="space-y-6" dir="rtl">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        عملکرد منتخب
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-medium">تعامل</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNum(performance.impressions)}</p>
          <p className="text-xs text-gray-500 mt-1">نمایش (Impressions)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatNum(performance.clicks)}</p>
          <p className="text-xs text-gray-500 mt-1">کلیک</p>
          <p className={`text-lg font-semibold mt-2 ${ctrColor(ctr)}`}>
            CTR: {(ctr * 100).toFixed(2)}%
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
            <Save className="w-5 h-5" />
            <span className="text-sm font-medium">رشد ذخیره</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNum(performance.savesDuring)}</p>
          <p className="text-xs text-gray-500 mt-1">ذخیره در بازه اسلات</p>
          <p className="text-xs text-gray-500 mt-1">baseline: {formatNum(performance.baselineSaves)}</p>
          <p className={`text-lg font-semibold mt-2 ${liftColor(saveLiftPercent)}`}>
            Save Lift: {saveLiftPercent != null ? `${saveLiftPercent.toFixed(1)}%` : '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">تأثیر ترند</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Baseline: {formatNum(performance.baselineScore)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Peak: {formatNum(performance.peakScore)}</p>
          <p className={`text-lg font-semibold mt-2 ${liftColor(scoreLiftPercent)}`}>
            Score Lift: {scoreLiftPercent != null ? `${scoreLiftPercent.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
            <Lightbulb className="w-5 h-5" />
            <span className="font-medium">پیشنهادات سیستم</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {recommendations.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
