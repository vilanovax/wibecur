'use client';

import type { ChartDay } from '@/lib/admin/analytics-metrics';

interface CombinedChartProps {
  data: ChartDay[];
}

const hasData = (data: ChartDay[]) =>
  data.some((d) => d.activeUsers > 0 || d.listsCreated > 0 || d.saves > 0);

export default function CombinedChart({ data }: CombinedChartProps) {
  if (!data.length || !hasData(data)) {
    return (
      <section
        className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden"
        style={{ direction: 'rtl' }}
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">نمای ۳۰ روزه</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            کاربران فعال، لیست‌های جدید، ذخیره‌ها
          </p>
        </div>
        <div className="p-8 flex flex-col items-center justify-center min-h-[200px] bg-slate-50">
          <div className="w-full max-w-md h-32 rounded-lg bg-slate-200 animate-pulse mb-4" />
          <p className="text-sm text-slate-600">
            داده کافی برای نمایش نمودار وجود ندارد.
          </p>
        </div>
      </section>
    );
  }

  const maxSaves = Math.max(1, ...data.map((d) => d.saves));
  const maxUsers = Math.max(1, ...data.map((d) => d.activeUsers));
  const maxLists = Math.max(1, ...data.map((d) => d.listsCreated));
  const chartHeight = 140;

  return (
    <section
      className="rounded-2xl shadow-sm border border-slate-200 bg-white overflow-hidden"
      style={{ direction: 'rtl' }}
    >
      <div className="p-6 border-b border-slate-200">
        <h2 className="font-semibold text-slate-800">نمای ۳۰ روزه</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          کاربران فعال، لیست‌های جدید، ذخیره‌ها
        </p>
      </div>
      <div className="p-6 overflow-x-auto">
        <div
          className="flex gap-1 items-end min-w-max"
          style={{ height: chartHeight }}
        >
          {data.map((day) => (
            <div
              key={day.date}
              className="flex flex-col gap-0.5 items-center flex-shrink-0 w-6"
              title={`${day.date}: کاربران ${day.activeUsers}، لیست ${day.listsCreated}، ذخیره ${day.saves}`}
            >
              <div
                className="w-4 rounded-t bg-emerald-500/80"
                style={{
                  height: `${(day.activeUsers / maxUsers) * 50}px`,
                  minHeight: day.activeUsers > 0 ? 4 : 0,
                }}
              />
              <div
                className="w-4 rounded-t bg-indigo-500/80"
                style={{
                  height: `${(day.listsCreated / maxLists) * 45}px`,
                  minHeight: day.listsCreated > 0 ? 4 : 0,
                }}
              />
              <div
                className="w-4 rounded-t bg-amber-500/80"
                style={{
                  height: `${(day.saves / maxSaves) * 70}px`,
                  minHeight: day.saves > 0 ? 4 : 0,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/80" />
            کاربران فعال
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500/80" />
            لیست‌های جدید
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/80" />
            ذخیره‌ها
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          از {data[0]?.date ?? ''} تا {data[data.length - 1]?.date ?? ''}
        </p>
      </div>
    </section>
  );
}
