'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { fa } from '@/lib/utils';
import type { WeeklyReport } from './featured-weekly-types';
import { addDays, getMonday } from './featured-weekly-types';

type Props = {
  hasActiveSlot: boolean;
  upcomingCount: number;
  pastCount: number;
  refreshKey?: number;
  initialReport?: WeeklyReport | null;
};

export default function FeaturedStatsBar({
  hasActiveSlot,
  upcomingCount,
  pastCount,
  refreshKey = 0,
  initialReport = null,
}: Props) {
  const [report, setReport] = useState<WeeklyReport | null>(initialReport);
  const [loading, setLoading] = useState(!initialReport);
  const [weekStart, setWeekStart] = useState(() =>
    getMonday(new Date()).toISOString().slice(0, 10)
  );
  const seededRef = useRef(Boolean(initialReport));

  useEffect(() => {
    if (initialReport && seededRef.current) {
      setReport(initialReport);
      setLoading(false);
    }
  }, [initialReport]);

  const loadReport = useCallback(
    (force = false) => {
      if (!weekStart) return;
      if (
        !force &&
        seededRef.current &&
        initialReport &&
        weekStart === initialReport.weekStart.slice(0, 10)
      ) {
        seededRef.current = false;
        return;
      }
      seededRef.current = false;
      setLoading(true);
      fetch(
        `/api/admin/custom/featured/weekly-report?weekStart=${encodeURIComponent(weekStart)}`
      )
        .then((res) => res.json())
        .then((json) => {
          if (json.error) {
            setReport(null);
            return;
          }
          setReport(json);
        })
        .catch(() => setReport(null))
        .finally(() => setLoading(false));
    },
    [weekStart, initialReport]
  );

  useEffect(() => {
    loadReport(refreshKey > 0);
  }, [loadReport, refreshKey]);

  const shiftWeek = (delta: number) => {
    setWeekStart((prev) => addDays(prev, delta * 7));
  };

  const weekLabel =
    report &&
    `${new Date(report.weekStart).toLocaleDateString('fa-IR', { dateStyle: 'short' })} – ${new Date(report.weekEnd).toLocaleDateString('fa-IR', { dateStyle: 'short' })}`;

  const pct = (n: number, digits = 1) =>
    `${fa(n.toFixed(digits).replace('.', '٫'))}٪`;
  const hasSignal =
    !!report &&
    (report.avgCTR > 0 || report.avgSaveLift != null || report.bestPerformer != null);
  const weekSlots = report?.totalSlots ?? 0;

  const summaryParts = [
    hasActiveSlot ? 'اسلات زنده' : 'لیست جایگزین',
    `${upcomingCount.toLocaleString('fa-IR')} در صف`,
    loading
      ? '…'
      : `${weekSlots.toLocaleString('fa-IR')} اسلات این هفته`,
  ];
  if (!loading && report?.bestPerformer?.listTitle) {
    summaryParts.push(`بهترین: ${report.bestPerformer.listTitle}`);
  }
  if (pastCount > 0) {
    summaryParts.push(`${pastCount.toLocaleString('fa-IR')} در تاریخچه`);
  }

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-(--color-text)">عملکرد هفته</p>
          {weekLabel ? (
            <p className="mt-0.5 text-sm text-wibe-secondary">{weekLabel}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-(--color-border) hover:bg-(--color-bg)"
            aria-label="هفته قبل"
          >
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() =>
              setWeekStart(getMonday(new Date()).toISOString().slice(0, 10))
            }
            className="inline-flex min-h-11 items-center rounded-xl border border-(--color-border) px-3 text-sm font-medium hover:bg-(--color-bg)"
          >
            این هفته
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-(--color-border) hover:bg-(--color-bg)"
            aria-label="هفته بعد"
          >
            <ChevronLeft className="size-4" strokeWidth={1.5} />
          </button>
          {loading && (
            <Loader2 className="size-4 animate-spin text-primary" strokeWidth={1.5} />
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-wibe-secondary">
        {summaryParts.join(' · ')}
      </p>

      {hasSignal && report ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm">
          <span>
            <span className="text-wibe-secondary">نرخ کلیک </span>
            <span className="font-semibold text-(--color-text)">
              {pct(report.avgCTR * 100, 2)}
            </span>
          </span>
          {report.avgSaveLift != null && (
            <span>
              <span className="text-wibe-secondary">رشد ذخیره </span>
              <span className="font-semibold text-(--color-text)">
                {pct(report.avgSaveLift)}
              </span>
            </span>
          )}
        </div>
      ) : !loading ? (
        <p className="text-sm leading-relaxed text-wibe-secondary">
          برای این هفته هنوز نرخ کلیک یا رشد ذخیره‌ای ثبت نشده.
        </p>
      ) : null}
    </section>
  );
}
