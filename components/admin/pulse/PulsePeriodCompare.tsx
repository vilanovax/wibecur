'use client';

import { ArrowLeftRight } from 'lucide-react';
import {
  formatPercentFa,
  type PeriodCompare,
  type PeriodMetricKey,
} from '@/lib/admin/pulse-utils';

const LABELS: Record<PeriodMetricKey, string> = {
  saves: 'ذخیره',
  comments: 'کامنت',
  newUsers: 'کاربر جدید',
  lists: 'لیست جدید',
};

interface PulsePeriodCompareProps {
  periodCompare: PeriodCompare | null;
}

export default function PulsePeriodCompare({ periodCompare }: PulsePeriodCompareProps) {
  if (!periodCompare) return null;

  return (
    <section className="rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/40 p-2.5 shadow-sm">
      <h2 className="text-xs font-semibold text-admin-text-primary mb-2 flex items-center gap-1.5">
        <ArrowLeftRight className="w-3.5 h-3.5 text-violet-500" />
        مقایسه ۷ روز با هفته قبل
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(Object.keys(LABELS) as PeriodMetricKey[]).map((key) => {
          const m = periodCompare[key];
          const pct = m.changePercent;
          const pctLabel =
            pct === null
              ? m.current > 0
                ? 'شروع فعالیت'
                : '—'
              : formatPercentFa(pct);
          const tone =
            pct === null
              ? 'text-admin-text-tertiary'
              : pct > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : pct < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-admin-text-tertiary';

          return (
            <div
              key={key}
              className="rounded-lg border border-admin-border dark:border-gray-600 bg-admin-muted/30 dark:bg-gray-700/20 p-2"
            >
              <p className="text-xs text-admin-text-tertiary mb-1">{LABELS[key]}</p>
              <p className="text-base font-bold tabular-nums text-admin-text-primary">
                {m.current.toLocaleString('fa-IR')}
              </p>
              <p className="text-[10px] text-admin-text-tertiary mt-0.5">
                هفته قبل: {m.previous.toLocaleString('fa-IR')}
              </p>
              <p className={`text-xs font-medium mt-1 ${tone}`} dir="ltr">
                {pctLabel}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
