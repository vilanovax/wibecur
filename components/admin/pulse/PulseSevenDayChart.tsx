'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import type { DayStat } from '@/lib/admin/pulse-utils';

type ChartMetric = 'saves' | 'comments' | 'newUsers';

const TABS: { id: ChartMetric; label: string }[] = [
  { id: 'saves', label: 'ذخیره' },
  { id: 'comments', label: 'کامنت' },
  { id: 'newUsers', label: 'کاربر جدید' },
];

interface PulseSevenDayChartProps {
  dailyStats: DayStat[];
  compact?: boolean;
}

export default function PulseSevenDayChart({ dailyStats, compact }: PulseSevenDayChartProps) {
  const [metric, setMetric] = useState<ChartMetric>('saves');

  if (dailyStats.length === 0) return null;

  const data = dailyStats.map((d) => d[metric]);
  const labels = dailyStats.map((d) => d.date.slice(5));

  return (
    <section
      className={
        compact
          ? 'rounded-2xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/40 p-3 shadow-sm'
          : 'rounded-2xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/40 p-4 shadow-sm'
      }
    >
      <div
        className={clsx(
          'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
          compact ? 'mb-1.5' : 'mb-3'
        )}
      >
        <h2 className="text-sm font-semibold text-admin-text-primary dark:text-gray-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          روند ۷ روز اخیر
        </h2>
        <div className="inline-flex rounded-lg border border-admin-border dark:border-gray-600 p-0.5 bg-admin-muted/50 dark:bg-gray-700/30">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMetric(tab.id)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                metric === tab.id
                  ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'text-admin-text-tertiary dark:text-[var(--color-text-subtle)] hover:text-admin-text-primary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <SevenDayLineChart data={data} labels={labels} dense={compact} />
    </section>
  );
}

function SevenDayLineChart({
  data,
  labels,
  dense,
}: {
  data: number[];
  labels: string[];
  dense?: boolean;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const w = 400;
  const h = dense ? 72 : 120;
  const pad = dense ? 16 : 24;
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={clsx('w-full max-w-full', dense ? 'h-[72px]' : 'h-auto')}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="pulse-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#pulse-line-fill)" />
        <polyline
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className={clsx(
          'flex justify-between text-admin-text-tertiary dark:text-[var(--color-text-subtle)]',
          dense ? 'mt-0.5 text-[10px]' : 'mt-1 text-xs'
        )}
      >
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}
