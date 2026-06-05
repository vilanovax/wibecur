export type PulseHealth = 'stable' | 'warning' | 'critical';

export type DayStat = {
  date: string;
  saves: number;
  comments: number;
  newUsers: number;
  lists: number;
};

export interface PulseRisk {
  reportsPending: number;
  commentReportsPending?: number;
  itemReportsPending?: number;
  suspiciousLists: number;
  saveSpikes: number;
}

export type PeriodMetricKey = 'saves' | 'comments' | 'newUsers' | 'lists';

export interface PeriodCompareMetric {
  current: number;
  previous: number;
  changePercent: number | null;
}

export type PeriodCompare = Record<PeriodMetricKey, PeriodCompareMetric>;

export interface SuggestionHealth {
  pendingTotal: number;
  approvedToday: number;
  rejectedToday: number;
  pendingItems: number;
  pendingLists: number;
}

/** درصد تغییر روزبه‌روز؛ اگر دیروز صفر بود و امروز فعالیت هست null برمی‌گردد */
export function computeDayOverDayPercent(today: number, yesterday: number): number | null {
  if (yesterday === 0) {
    if (today === 0) return 0;
    return null;
  }
  return Math.round(((today - yesterday) / yesterday) * 100);
}

/** نمایش درصد با علامت در جهت LTR برای جلوگیری از 100%- در RTL */
export function formatPercentFa(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const abs = Math.abs(value).toLocaleString('fa-IR');
  return `${sign}${abs}%`;
}

export function dayOverDayLabel(today: number, yesterday: number): string {
  if (today === 0 && yesterday > 0) {
    return `۰ امروز · دیروز ${yesterday.toLocaleString('fa-IR')}`;
  }
  const pct = computeDayOverDayPercent(today, yesterday);
  if (pct === null && today > 0) {
    return `امروز ${today.toLocaleString('fa-IR')} · دیروز ۰`;
  }
  if (pct === null) return 'بدون فعالیت';
  if (pct === 0 && today === 0 && yesterday === 0) return 'بدون فعالیت';
  if (pct === -100) {
    return `۰ امروز · دیروز ${yesterday.toLocaleString('fa-IR')}`;
  }
  return `${formatPercentFa(pct)} نسبت به دیروز`;
}

/** برای کارت‌ها: آیا درصد منفی نمایش داده شود یا متن توضیحی */
export function dayOverDayTone(
  today: number,
  yesterday: number
): { text: string; positive?: boolean; muted?: boolean } {
  const text = dayOverDayLabel(today, yesterday);
  if (today === 0 && yesterday === 0) return { text, muted: true };
  if (today === 0 && yesterday > 0) return { text, muted: true };
  const pct = computeDayOverDayPercent(today, yesterday);
  if (pct === null) return { text };
  if (pct > 0) return { text, positive: true };
  if (pct < 0) return { text, muted: true };
  return { text, muted: true };
}

export function derivePulseHealth(
  risk?: PulseRisk | null,
  suggestions?: SuggestionHealth | null
): PulseHealth {
  const reports = risk?.reportsPending ?? 0;
  const spikes = risk?.saveSpikes ?? 0;
  const suspicious = risk?.suspiciousLists ?? 0;
  const pending = suggestions?.pendingTotal ?? 0;

  if (reports >= 10 || spikes >= 3 || suspicious >= 5) return 'critical';
  if (reports >= 3 || spikes >= 1 || suspicious >= 1 || pending >= 20) return 'warning';
  return 'stable';
}

export function sumPeriod(stats: DayStat[], key: PeriodMetricKey): number {
  return stats.reduce((acc, d) => acc + d[key], 0);
}

export function buildPeriodCompare(stats: DayStat[]): PeriodCompare | null {
  if (stats.length < 14) return null;
  const prev7 = stats.slice(0, 7);
  const recent7 = stats.slice(7, 14);
  const keys: PeriodMetricKey[] = ['saves', 'comments', 'newUsers', 'lists'];
  const result = {} as PeriodCompare;
  for (const key of keys) {
    const current = sumPeriod(recent7, key);
    const previous = sumPeriod(prev7, key);
    result[key] = {
      current,
      previous,
      changePercent: computeDayOverDayPercent(current, previous),
    };
  }
  return result;
}

export interface PulseReportInput {
  generatedAt: string;
  health: PulseHealth;
  today: {
    saves: number;
    comments: number;
    activeUsers: number;
    newUsers: number;
    lists: number;
    interactions: number;
  };
  risk?: PulseRisk | null;
  suggestions?: SuggestionHealth | null;
  periodCompare?: PeriodCompare | null;
  dailyStats: DayStat[];
  trendingTitles?: string[];
}

const healthFa: Record<PulseHealth, string> = {
  stable: 'پایدار',
  warning: 'هشدار',
  critical: 'بحران',
};

export function buildPulseReportText(input: PulseReportInput): string {
  const lines: string[] = [
    'گزارش پالس وایب — WibeCur',
    '═'.repeat(40),
    `تاریخ تولید: ${new Date(input.generatedAt).toLocaleString('fa-IR')}`,
    `سلامت: ${healthFa[input.health]}`,
    '',
    '── فعالیت امروز ──',
    `ذخیره: ${input.today.saves.toLocaleString('fa-IR')}`,
    `کامنت: ${input.today.comments.toLocaleString('fa-IR')}`,
    `کاربران فعال: ${input.today.activeUsers.toLocaleString('fa-IR')}`,
    `ثبت‌نام: ${input.today.newUsers.toLocaleString('fa-IR')}`,
    `لیست جدید: ${input.today.lists.toLocaleString('fa-IR')}`,
    `تعامل کل: ${input.today.interactions.toLocaleString('fa-IR')}`,
  ];

  if (input.risk) {
    lines.push('', '── ریسک ──');
    lines.push(`ریپورت کل: ${input.risk.reportsPending.toLocaleString('fa-IR')}`);
    if (input.risk.commentReportsPending != null) {
      lines.push(`ریپورت کامنت: ${input.risk.commentReportsPending.toLocaleString('fa-IR')}`);
    }
    if (input.risk.itemReportsPending != null) {
      lines.push(`ریپورت آیتم: ${input.risk.itemReportsPending.toLocaleString('fa-IR')}`);
    }
    lines.push(`اسپایک ذخیره (۷ روز): ${input.risk.saveSpikes.toLocaleString('fa-IR')}`);
  }

  if (input.suggestions) {
    lines.push('', '── پیشنهادها ──');
    lines.push(`در انتظار: ${input.suggestions.pendingTotal.toLocaleString('fa-IR')}`);
    lines.push(`تأیید امروز: ${input.suggestions.approvedToday.toLocaleString('fa-IR')}`);
    lines.push(`رد امروز: ${input.suggestions.rejectedToday.toLocaleString('fa-IR')}`);
  }

  if (input.periodCompare) {
    lines.push('', '── مقایسه هفتگی ──');
    const labels: Record<PeriodMetricKey, string> = {
      saves: 'ذخیره',
      comments: 'کامنت',
      newUsers: 'کاربر جدید',
      lists: 'لیست',
    };
    for (const key of Object.keys(labels) as PeriodMetricKey[]) {
      const m = input.periodCompare[key];
      const ch =
        m.changePercent === null ? '—' : formatPercentFa(m.changePercent);
      lines.push(
        `${labels[key]}: ${m.current.toLocaleString('fa-IR')} (هفته قبل: ${m.previous.toLocaleString('fa-IR')}) ${ch}`
      );
    }
  }

  if (input.trendingTitles?.length) {
    lines.push('', '── ترند لیست ──');
    input.trendingTitles.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  }

  if (input.dailyStats.length > 0) {
    lines.push('', '── آمار روزانه ──');
    lines.push('تاریخ | ذخیره | کامنت | کاربر | لیست');
    for (const d of input.dailyStats) {
      lines.push(
        `${d.date} | ${d.saves} | ${d.comments} | ${d.newUsers} | ${d.lists}`
      );
    }
  }

  lines.push('', '— پایان گزارش —');
  return lines.join('\n');
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printPulseReportHtml(htmlBody: string, title = 'گزارش پالس وایب') {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Tahoma, sans-serif; padding: 24px; color: #111; line-height: 1.6; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 13px; margin-bottom: 20px; }
    section { margin-bottom: 16px; }
    h2 { font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: right; }
    th { background: #f5f5f5; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>${htmlBody}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export function exportPulseDailyCsv(stats: DayStat[], filename = 'pulse-14d.csv') {
  const header = 'date,saves,comments,newUsers,lists';
  const rows = stats.map(
    (d) => `${d.date},${d.saves},${d.comments},${d.newUsers},${d.lists}`
  );
  const blob = new Blob(['\uFEFF' + header + '\n' + rows.join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;
    return (json.data ?? json) as T;
  } catch {
    return null;
  }
}
