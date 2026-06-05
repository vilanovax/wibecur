export type DashboardRange = 'today' | '7d' | '30d';

const MS_DAY = 24 * 60 * 60 * 1000;

export function parseDashboardRange(value: string | null | undefined): DashboardRange {
  if (value === '7d' || value === '30d') return value;
  return 'today';
}

export function getDashboardPeriod(range: DashboardRange) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  let periodStart: Date;
  let prevPeriodStart: Date;
  let prevPeriodEnd: Date;
  let periodLabel: string;
  let bookmarkWindowStart: Date;

  switch (range) {
    case '7d':
      periodStart = new Date(now.getTime() - 7 * MS_DAY);
      prevPeriodStart = new Date(periodStart.getTime() - 7 * MS_DAY);
      prevPeriodEnd = periodStart;
      periodLabel = '۷ روز اخیر';
      bookmarkWindowStart = periodStart;
      break;
    case '30d':
      periodStart = new Date(now.getTime() - 30 * MS_DAY);
      prevPeriodStart = new Date(periodStart.getTime() - 30 * MS_DAY);
      prevPeriodEnd = periodStart;
      periodLabel = '۳۰ روز اخیر';
      bookmarkWindowStart = periodStart;
      break;
    case 'today':
    default:
      periodStart = todayStart;
      prevPeriodStart = new Date(todayStart.getTime() - MS_DAY);
      prevPeriodEnd = todayStart;
      periodLabel = 'امروز';
      bookmarkWindowStart = new Date(now.getTime() - MS_DAY);
      break;
  }

  const last7d = new Date(now.getTime() - 7 * MS_DAY);
  const last24h = new Date(now.getTime() - MS_DAY);

  return {
    periodStart,
    prevPeriodStart,
    prevPeriodEnd,
    periodLabel,
    bookmarkWindowStart,
    last7d,
    last24h,
    range,
  };
}
