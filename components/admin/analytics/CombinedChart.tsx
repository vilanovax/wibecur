'use client';

import type { ChartDay, AnalyticsRangeDays } from '@/lib/admin/analytics-metrics';
import { formatJalaliNumeric } from '@/lib/jalali';
import { faNumber } from '@/lib/utils';

interface CombinedChartProps {
  data: ChartDay[];
  windowDays: AnalyticsRangeDays;
}

const hasData = (data: ChartDay[]) =>
  data.some((d) => d.activeUsers > 0 || d.listsCreated > 0 || d.saves > 0);

function dayLabel(iso: string): string {
  try {
    return formatJalaliNumeric(new Date(`${iso}T12:00:00Z`));
  } catch {
    return iso;
  }
}

export default function CombinedChart({ data, windowDays }: CombinedChartProps) {
  const windowSlice = data.slice(-windowDays);
  const series = windowSlice.length > 0 ? windowSlice : data;

  if (!series.length || !hasData(series)) {
    return (
      <section
        className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
        dir="rtl"
      >
        <h2 className="text-sm font-semibold text-(--color-text)">نمای روند</h2>
        <p className="mt-2 text-sm leading-relaxed text-wibe-secondary">
          برای این بازه هنوز ذخیره، لیست جدید یا کاربر فعالی ثبت نشده.
        </p>
      </section>
    );
  }

  const totals = series.reduce(
    (acc, d) => {
      acc.saves += d.saves;
      acc.lists += d.listsCreated;
      acc.users += d.activeUsers;
      return acc;
    },
    { saves: 0, lists: 0, users: 0 }
  );

  const maxSaves = Math.max(1, ...series.map((d) => d.saves));
  const maxUsers = Math.max(1, ...series.map((d) => d.activeUsers));
  const maxLists = Math.max(1, ...series.map((d) => d.listsCreated));
  const chartHeight = 120;

  return (
    <section
      className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
      dir="rtl"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-(--color-text)">
            نمای {faNumber(windowDays)} روزه
          </h2>
          <p className="mt-1 text-sm text-wibe-secondary">
            {dayLabel(series[0].date)} تا {dayLabel(series[series.length - 1].date)}
          </p>
        </div>
        <p className="text-sm text-wibe-secondary">
          {faNumber(totals.saves)} ذخیره · {faNumber(totals.lists)} لیست ·{' '}
          {faNumber(totals.users)} کاربر·روز
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div
          className="flex min-w-max items-end gap-1"
          style={{ height: chartHeight }}
          role="img"
          aria-label="نمودار کاربران فعال، لیست‌های جدید و ذخیره‌ها"
        >
          {series.map((day) => {
            const usersH = Math.round((day.activeUsers / maxUsers) * 40);
            const listsH = Math.round((day.listsCreated / maxLists) * 36);
            const savesH = Math.round((day.saves / maxSaves) * 56);
            return (
              <div
                key={day.date}
                className="flex w-5 shrink-0 flex-col items-center gap-0.5"
                title={`${dayLabel(day.date)}: کاربر ${faNumber(day.activeUsers)}، لیست ${faNumber(day.listsCreated)}، ذخیره ${faNumber(day.saves)}`}
              >
                <div
                  className="w-3 rounded-t bg-emerald-500/80"
                  style={{
                    height: `${day.activeUsers > 0 ? Math.max(usersH, 4) : 0}px`,
                  }}
                />
                <div
                  className="w-3 rounded-t bg-primary/80"
                  style={{
                    height: `${day.listsCreated > 0 ? Math.max(listsH, 4) : 0}px`,
                  }}
                />
                <div
                  className="w-3 rounded-t bg-amber-500/80"
                  style={{
                    height: `${day.saves > 0 ? Math.max(savesH, 4) : 0}px`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-wibe-secondary">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded bg-emerald-500/80" />
          کاربران فعال
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded bg-primary/80" />
          لیست‌های جدید
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded bg-amber-500/80" />
          ذخیره‌ها
        </span>
      </div>
    </section>
  );
}
