'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, Save, Award, Radio, Layers, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
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
      // Skip first client fetch when SSR already seeded current week
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
  const facts = [
    {
      icon: Radio,
      label: 'وضعیت هوم',
      value: hasActiveSlot ? 'اسلات زنده' : 'لیست جایگزین',
    },
    {
      icon: Layers,
      label: 'صف بعدی',
      value: upcomingCount.toLocaleString('fa-IR'),
    },
    {
      icon: BarChart3,
      label: 'اسلات این هفته',
      value: loading ? '…' : (report?.totalSlots ?? 0).toLocaleString('fa-IR'),
    },
    {
      icon: Award,
      label: 'بهترین لیست',
      value: loading ? '…' : report?.bestPerformer?.listTitle || 'هنوز نیست',
    },
  ];

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text)]">عملکرد هفته</span>
          {weekLabel ? ` · ${weekLabel}` : ''}
          {pastCount > 0 ? ` · ${pastCount.toLocaleString('fa-IR')} اسلات در تاریخچه` : ''}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
            aria-label="هفته قبل"
          >
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() =>
              setWeekStart(getMonday(new Date()).toISOString().slice(0, 10))
            }
            className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-3 text-sm font-medium hover:bg-[var(--color-bg)]"
          >
            این هفته
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
            aria-label="هفته بعد"
          >
            <ChevronLeft className="size-4" strokeWidth={1.5} />
          </button>
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="mb-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Icon className="size-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{label}</span>
            </div>
            <p className="truncate text-lg font-bold leading-snug text-[var(--color-text)]" title={String(value)}>
              {value}
            </p>
          </div>
        ))}
      </div>
      {hasSignal && report ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <BarChart3 className="size-4" strokeWidth={1.5} />
              نرخ کلیک
            </div>
            <p className="text-lg font-bold text-[var(--color-text)]">{pct(report.avgCTR * 100, 2)}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Save className="size-4" strokeWidth={1.5} />
              رشد ذخیره
            </div>
            <p className="text-lg font-bold text-[var(--color-text)]">
              {report.avgSaveLift != null ? pct(report.avgSaveLift) : 'هنوز نیست'}
            </p>
          </div>
        </div>
      ) : !loading ? (
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          برای این هفته هنوز نرخ کلیک یا رشد ذخیره‌ای ثبت نشده.
        </p>
      ) : null}
    </section>
  );
}
