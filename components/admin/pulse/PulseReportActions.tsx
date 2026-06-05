'use client';

import { useCallback } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import {
  buildPulseReportText,
  downloadTextFile,
  exportPulseDailyCsv,
  printPulseReportHtml,
  type DayStat,
  type PeriodCompare,
  type PulseReportInput,
  type PulseRisk,
  type SuggestionHealth,
  type PulseHealth,
} from '@/lib/admin/pulse-utils';

interface PulseReportActionsProps {
  stats: DayStat[];
  report: PulseReportInput;
}

function buildPrintHtml(report: PulseReportInput): string {
  const h = { stable: 'پایدار', warning: 'هشدار', critical: 'بحران' }[report.health];
  const rows = report.dailyStats
    .map(
      (d) =>
        `<tr><td>${d.date}</td><td>${d.saves.toLocaleString('fa-IR')}</td><td>${d.comments.toLocaleString('fa-IR')}</td><td>${d.newUsers.toLocaleString('fa-IR')}</td><td>${d.lists.toLocaleString('fa-IR')}</td></tr>`
    )
    .join('');

  const trending =
    report.trendingTitles?.length ?
      `<ul>${report.trendingTitles.map((t) => `<li>${t}</li>`).join('')}</ul>`
    : '<p>—</p>';

  return `
    <h1>گزارش پالس وایب</h1>
    <p class="meta">${new Date(report.generatedAt).toLocaleString('fa-IR')} · سلامت: ${h}</p>
    <section>
      <h2>فعالیت امروز</h2>
      <p>ذخیره: ${report.today.saves.toLocaleString('fa-IR')} · کامنت: ${report.today.comments.toLocaleString('fa-IR')}</p>
      <p>کاربران فعال: ${report.today.activeUsers.toLocaleString('fa-IR')} · ثبت‌نام: ${report.today.newUsers.toLocaleString('fa-IR')}</p>
      <p>لیست جدید: ${report.today.lists.toLocaleString('fa-IR')} · تعامل: ${report.today.interactions.toLocaleString('fa-IR')}</p>
    </section>
    <section><h2>ترند لیست</h2>${trending}</section>
    <section>
      <h2>آمار روزانه</h2>
      <table>
        <thead><tr><th>تاریخ</th><th>ذخیره</th><th>کامنت</th><th>کاربر</th><th>لیست</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">بدون داده</td></tr>'}</tbody>
      </table>
    </section>
  `;
}

export default function PulseReportActions({ stats, report }: PulseReportActionsProps) {
  const dateSlug = new Date().toISOString().slice(0, 10);

  const onTxt = useCallback(() => {
    downloadTextFile(buildPulseReportText(report), `pulse-report-${dateSlug}.txt`);
  }, [report, dateSlug]);

  const onPrint = useCallback(() => {
    printPulseReportHtml(buildPrintHtml(report));
  }, [report]);

  const btnClass =
    'inline-flex items-center gap-1.5 rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-admin-text-secondary hover:bg-admin-muted dark:hover:bg-gray-700 transition-colors';

  return (
    <div className="flex flex-wrap gap-2" dir="rtl">
      <button type="button" onClick={() => exportPulseDailyCsv(stats)} className={btnClass}>
        <Download className="h-3.5 w-3.5" />
        CSV
      </button>
      <button type="button" onClick={onTxt} className={btnClass}>
        <FileText className="h-3.5 w-3.5" />
        گزارش متنی
      </button>
      <button type="button" onClick={onPrint} className={btnClass}>
        <Printer className="h-3.5 w-3.5" />
        چاپ / PDF
      </button>
    </div>
  );
}

export function buildPulseReportFromDashboard(params: {
  overview: {
    todaySaves: number;
    todayComments: number;
    activeUsersToday: number;
    newUsersToday: number;
    todayLists?: number;
    todayInteractions: number;
    lastSync?: string;
    risk?: PulseRisk;
  };
  health: PulseHealth;
  dailyStats: DayStat[];
  periodCompare: PeriodCompare | null;
  suggestions: SuggestionHealth | null;
  trendingLists: { title: string }[];
}): PulseReportInput {
  return {
    generatedAt: params.overview.lastSync ?? new Date().toISOString(),
    health: params.health,
    today: {
      saves: params.overview.todaySaves,
      comments: params.overview.todayComments,
      activeUsers: params.overview.activeUsersToday,
      newUsers: params.overview.newUsersToday,
      lists: params.overview.todayLists ?? 0,
      interactions: params.overview.todayInteractions,
    },
    risk: params.overview.risk,
    suggestions: params.suggestions,
    periodCompare: params.periodCompare,
    dailyStats: params.dailyStats,
    trendingTitles: params.trendingLists.map((t) => t.title),
  };
}
