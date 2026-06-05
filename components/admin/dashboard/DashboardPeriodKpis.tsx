'use client';

import KpiCard from './KpiCard';
import type { KpiItem } from '@/lib/admin/types';
import type { DashboardRange } from '@/lib/admin/dashboard-range';

const RANGE_LABELS: Record<DashboardRange, string> = {
  today: 'امروز',
  '7d': '۷ روز اخیر',
  '30d': '۳۰ روز اخیر',
};

interface DashboardPeriodKpisProps {
  kpis: KpiItem[];
  periodLabel: string;
  range: DashboardRange;
}

export default function DashboardPeriodKpis({
  kpis,
  periodLabel,
  range,
}: DashboardPeriodKpisProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text)]">
            شاخص‌های {periodLabel}
          </span>
          <span className="mx-2 text-[var(--color-border)]">·</span>
          بازه انتخاب‌شده:{' '}
          <span className="font-medium">{RANGE_LABELS[range]}</span>
          <span className="mx-2 text-[var(--color-border)]">·</span>
          <span className="text-xs">
            پالس سیستم و رادار ترند لحظه‌ای هستند
          </span>
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {kpis.map((item) => (
          <KpiCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}
