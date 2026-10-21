'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Save, TrendingUp, Lightbulb } from 'lucide-react';
import { fa, faNumber } from '@/lib/utils';
import type { FeaturedSlotPerformance } from '@/lib/admin/featured-management-types';

type Performance = FeaturedSlotPerformance;

type Props = {
  slotId: string;
  initialPerformance?: Performance | null;
  initialRecommendations?: string[];
  onRefresh?: () => void;
};

function formatNum(n: number | null): string {
  if (n == null) return '—';
  if (Number.isInteger(n)) return faNumber(n);
  return fa(n.toFixed(1).replace('.', '٫'));
}

function formatPct(n: number): string {
  return `${fa(n.toFixed(1).replace('.', '٫'))}٪`;
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

export default function FeaturedPerformanceSection({
  slotId,
  initialPerformance = null,
  initialRecommendations = [],
}: Props) {
  const [performance, setPerformance] = useState<Performance | null>(
    initialPerformance
  );
  const [recommendations, setRecommendations] = useState<string[]>(
    initialRecommendations
  );
  const [loading, setLoading] = useState(!initialPerformance);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPerformance) {
      setPerformance(initialPerformance);
      setRecommendations(initialRecommendations);
      setLoading(false);
      setError(null);
      return;
    }

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
        setRecommendations(
          Array.isArray(json.recommendations) ? json.recommendations : []
        );
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
  }, [slotId, initialPerformance, initialRecommendations]);

  if (loading) {
    return (
      <section
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        dir="rtl"
      >
        <h2 className="mb-2 text-sm font-semibold text-[var(--color-text)]">عملکرد همین اسلات</h2>
        <p className="text-sm text-[var(--color-text-muted)]">در حال بارگذاری…</p>
      </section>
    );
  }

  if (error || !performance) {
    return (
      <section
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        dir="rtl"
      >
        <h2 className="mb-2 text-sm font-semibold text-[var(--color-text)]">عملکرد همین اسلات</h2>
        <p className="text-sm text-red-700">
          {error || 'داده‌ای یافت نشد'}
        </p>
      </section>
    );
  }

  const { ctr, saveLiftPercent, scoreLiftPercent } = performance;
  const quiet =
    performance.impressions === 0 &&
    performance.clicks === 0 &&
    saveLiftPercent == null &&
    scoreLiftPercent == null;

  return (
    <section className="space-y-4" dir="rtl">
      <h2 className="text-lg font-semibold leading-snug text-[var(--color-text)]">عملکرد همین اسلات</h2>
      {quiet ? (
        <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
          هنوز نمایش یا کلیکی برای این اسلات ثبت نشده.
        </p>
      ) : (
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <BarChart3 className="size-4" strokeWidth={1.5} />
            <span>تعامل</span>
          </div>
          <p className="text-lg font-bold text-[var(--color-text)]">{formatNum(performance.impressions)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">نمایش</p>
          <p className="mt-2 text-lg font-bold text-[var(--color-text)]">{formatNum(performance.clicks)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">کلیک</p>
          <p className={`mt-2 text-sm font-semibold ${ctrColor(ctr)}`}>نرخ کلیک {formatPct(ctr * 100)}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Save className="size-4" strokeWidth={1.5} />
            <span>رشد ذخیره</span>
          </div>
          <p className="text-lg font-bold text-[var(--color-text)]">{formatNum(performance.savesDuring)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">ذخیره در بازه اسلات</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">پایه {formatNum(performance.baselineSaves)}</p>
          <p className={`mt-2 text-sm font-semibold ${liftColor(saveLiftPercent)}`}>
            {saveLiftPercent != null ? formatPct(saveLiftPercent) : 'هنوز نیست'}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <TrendingUp className="size-4" strokeWidth={1.5} />
            <span>تأثیر ترند</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">پایه {formatNum(performance.baselineScore)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">اوج {formatNum(performance.peakScore)}</p>
          <p className={`mt-2 text-sm font-semibold ${liftColor(scoreLiftPercent)}`}>
            {scoreLiftPercent != null ? formatPct(scoreLiftPercent) : 'هنوز نیست'}
          </p>
        </div>
      </div>
      )}

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
