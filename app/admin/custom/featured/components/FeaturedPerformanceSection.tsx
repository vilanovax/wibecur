'use client';

import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
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

function ctrTone(ctr: number): string {
  if (ctr >= 0.18) return 'text-emerald-700';
  if (ctr >= 0.05) return 'text-amber-700';
  return 'text-red-700';
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
        className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
        dir="rtl"
      >
        <h2 className="mb-2 text-sm font-semibold text-(--color-text)">عملکرد همین اسلات</h2>
        <p className="text-sm text-wibe-secondary">در حال بارگذاری…</p>
      </section>
    );
  }

  if (error || !performance) {
    return (
      <section
        className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
        dir="rtl"
      >
        <h2 className="mb-2 text-sm font-semibold text-(--color-text)">عملکرد همین اسلات</h2>
        <p className="text-sm text-red-700">{error || 'داده‌ای یافت نشد'}</p>
      </section>
    );
  }

  const { ctr, saveLiftPercent, scoreLiftPercent } = performance;
  const quiet =
    performance.impressions === 0 &&
    performance.clicks === 0 &&
    saveLiftPercent == null &&
    scoreLiftPercent == null;

  const metrics = quiet
    ? []
    : [
        { label: 'نمایش', value: formatNum(performance.impressions) },
        { label: 'کلیک', value: formatNum(performance.clicks) },
        {
          label: 'نرخ کلیک',
          value: formatPct(ctr * 100),
          className: ctrTone(ctr),
        },
        { label: 'ذخیره', value: formatNum(performance.savesDuring) },
        ...(saveLiftPercent != null
          ? [{ label: 'رشد ذخیره', value: formatPct(saveLiftPercent) }]
          : []),
        ...(scoreLiftPercent != null
          ? [{ label: 'تأثیر ترند', value: formatPct(scoreLiftPercent) }]
          : []),
      ];

  return (
    <section className="space-y-3" dir="rtl">
      <h2 className="text-sm font-semibold leading-snug text-(--color-text)">
        عملکرد همین اسلات
      </h2>
      {quiet ? (
        <p className="text-sm leading-relaxed text-wibe-secondary">
          هنوز نمایش یا کلیکی برای این اسلات ثبت نشده.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-(--color-border) bg-(--color-border) sm:grid-cols-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-(--color-surface) px-4 py-3"
            >
              <p className="text-sm text-wibe-secondary">{metric.label}</p>
              <p
                className={`mt-1 text-lg font-bold leading-snug ${
                  metric.className ?? 'text-(--color-text)'
                }`}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900">
            <Lightbulb className="size-4" strokeWidth={1.5} />
            پیشنهاد سیستم
          </div>
          <ul className="space-y-1 text-sm leading-relaxed text-amber-900">
            {recommendations.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
