'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart3,
  Save,
  Award,
  Calendar,
  Radio,
  Layers,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
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

  const statCards = [
    {
      icon: Radio,
      label: 'وضعیت هوم',
      value: hasActiveSlot ? 'اسلات زنده' : 'Fallback',
      sub: hasActiveSlot ? 'منتخب زمان‌بندی‌شده' : 'لیست ویژه ستاره‌دار',
      accent: hasActiveSlot
        ? 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/60 dark:border-emerald-800/60'
        : 'from-slate-500/10 to-slate-600/5 border-slate-200/60 dark:border-gray-700',
    },
    {
      icon: Layers,
      label: 'صف اسلات',
      value: upcomingCount.toLocaleString('fa-IR'),
      sub: 'آینده',
      accent:
        'from-sky-500/10 to-sky-600/5 border-sky-200/50 dark:border-sky-800/60',
    },
    {
      icon: Calendar,
      label: 'اسلات این هفته',
      value: loading ? '…' : (report?.totalSlots ?? 0).toLocaleString('fa-IR'),
      sub: weekLabel ?? 'هفته جاری',
      accent:
        'from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/60',
    },
    {
      icon: BarChart3,
      label: 'میانگین CTR',
      value: loading
        ? '…'
        : report
          ? `${(report.avgCTR * 100).toFixed(2)}٪`
          : '—',
      accent:
        'from-teal-500/10 to-teal-600/5 border-teal-200/50 dark:border-teal-800/60',
    },
    {
      icon: Save,
      label: 'میانگین Save Lift',
      value: loading
        ? '…'
        : report?.avgSaveLift != null
          ? `${report.avgSaveLift.toFixed(1)}٪`
          : '—',
      accent:
        'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/60',
    },
    {
      icon: Award,
      label: 'بهترین لیست هفته',
      value: loading ? '…' : (report?.bestPerformer?.listTitle ?? '—'),
      sub:
        report?.bestPerformer != null
          ? `+${report.bestPerformer.saveLiftPercent.toFixed(1)}٪`
          : pastCount > 0
            ? `${pastCount.toLocaleString('fa-IR')} اسلات گذشته`
            : undefined,
      accent:
        'from-amber-500/10 to-amber-600/5 border-amber-200/50 dark:border-amber-800/60',
    },
  ];

  return (
    <section className="space-y-3" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text)]">آمار عملکرد</span>
          {weekLabel && (
            <>
              <span className="mx-2 text-[var(--color-border)]">·</span>
              {weekLabel}
            </>
          )}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
            aria-label="هفته قبل"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setWeekStart(getMonday(new Date()).toISOString().slice(0, 10))
            }
            className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-bg)]"
          >
            این هفته
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
            aria-label="هفته بعد"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
          )}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map(({ icon: Icon, label, value, sub, accent }) => (
          <div
            key={label}
            className={`rounded-2xl border bg-gradient-to-br ${accent} p-3.5 sm:p-4 shadow-sm min-w-0`}
          >
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1.5">
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
            <p
              className="text-lg sm:text-xl font-bold text-[var(--color-text)] truncate"
              title={String(value)}
            >
              {value}
            </p>
            {sub && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                {sub}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
