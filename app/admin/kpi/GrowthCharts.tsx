'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fa } from '@/lib/utils';
import { formatJalali } from '@/lib/jalali';

function chartDay(iso: string) {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return formatJalali(date, { year: false });
}

const axisTick = { fontSize: 12, fill: 'var(--color-text-muted)' };
const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid var(--color-border)',
  fontSize: 12,
};

export default function GrowthCharts({
  activeUsers,
  savesVsLists,
}: {
  activeUsers: { date: string; count: number }[];
  savesVsLists: { date: string; saves: number; lists: number }[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-admin-border dark:border-gray-600 p-4">
        <h3 className="text-sm font-medium text-admin-text-primary dark:text-white mb-3">
          کاربران فعال، ۳۰ روز
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={activeUsers} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={axisTick}
              tickFormatter={chartDay}
              interval={6}
              stroke="var(--color-border)"
            />
            <YAxis tick={axisTick} width={36} tickFormatter={(value) => fa(value)} stroke="var(--color-border)" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [fa(value), 'کاربر']}
              labelFormatter={(label) => chartDay(String(label))}
            />
            <Line type="monotone" dataKey="count" stroke="var(--color-brand)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-admin-border dark:border-gray-600 p-4">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h3 className="text-sm font-medium text-admin-text-primary dark:text-white">
            ذخیره و لیست جدید، ۳۰ روز
          </h3>
          <div className="flex items-center gap-3 text-xs text-admin-text-tertiary">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded bg-brand" /> ذخیره
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded bg-amber-500" /> لیست
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={savesVsLists} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={axisTick}
              tickFormatter={chartDay}
              interval={6}
              stroke="var(--color-border)"
            />
            <YAxis tick={axisTick} width={36} tickFormatter={(value) => fa(value)} stroke="var(--color-border)" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [
                fa(value),
                name === 'saves' ? 'ذخیره' : 'لیست',
              ]}
              labelFormatter={(label) => chartDay(String(label))}
            />
            <Line type="monotone" dataKey="saves" stroke="var(--color-brand)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="lists" stroke="var(--color-hot)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
