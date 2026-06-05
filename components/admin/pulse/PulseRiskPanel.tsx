'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  MessageSquare,
  Package,
  Lightbulb,
  Shield,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import type { PulseRisk, SuggestionHealth, PulseHealth } from '@/lib/admin/pulse-utils';

interface PulseRiskPanelProps {
  risk?: PulseRisk | null;
  suggestions?: SuggestionHealth | null;
  health: PulseHealth;
}

const healthCopy: Record<PulseHealth, { label: string; desc: string; className: string }> = {
  stable: {
    label: 'پایدار',
    desc: 'ریپورت و صف پیشنهاد در محدوده عادی است.',
    className: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/10',
  },
  warning: {
    label: 'هشدار',
    desc: 'برخی شاخص‌ها نیاز به بررسی دارند.',
    className: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/10',
  },
  critical: {
    label: 'بحران',
    desc: 'اقدام فوری روی ریپورت یا صف پیشنهاد توصیه می‌شود.',
    className: 'text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/40 bg-red-50/60 dark:bg-red-500/10',
  },
};

function RiskRow({
  href,
  label,
  value,
  icon: Icon,
  urgent,
}: {
  href: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${
        urgent
          ? 'border-red-200 dark:border-red-500/40 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100/80'
          : 'border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:bg-admin-muted dark:hover:bg-gray-700/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            urgent ? 'bg-red-100 dark:bg-red-500/20' : 'bg-admin-muted dark:bg-gray-700'
          }`}
        >
          <Icon className={`h-5 w-5 ${urgent ? 'text-red-600' : 'text-violet-600 dark:text-violet-400'}`} />
        </span>
        <div>
          <p className="font-medium text-admin-text-primary dark:text-gray-100">{label}</p>
          <p className="text-xs text-admin-text-tertiary">مشاهده و رسیدگی</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xl font-bold tabular-nums ${urgent ? 'text-red-700 dark:text-red-300' : ''}`}>
          {value.toLocaleString('fa-IR')}
        </span>
        <ChevronLeft className="h-4 w-4 text-admin-text-tertiary" />
      </div>
    </Link>
  );
}

export default function PulseRiskPanel({ risk, suggestions, health }: PulseRiskPanelProps) {
  const commentReports =
    risk?.commentReportsPending ?? risk?.reportsPending ?? 0;
  const itemReports = risk?.itemReportsPending ?? 0;
  const totalReports = risk?.reportsPending ?? commentReports + itemReports;
  const pendingSuggestions = suggestions?.pendingTotal ?? 0;
  const hc = healthCopy[health];

  const allClear =
    totalReports === 0 &&
    pendingSuggestions === 0 &&
    (risk?.saveSpikes ?? 0) === 0 &&
    (risk?.suspiciousLists ?? 0) === 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${hc.className}`}>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5" />
          <span className="font-semibold">سلامت کلی: {hc.label}</span>
        </div>
        <p className="text-sm opacity-90">{hc.desc}</p>
      </div>

      {allClear ? (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/10 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-medium text-emerald-800 dark:text-emerald-200">مورد باز برای اقدام فوری نیست</p>
          <p className="text-sm text-admin-text-tertiary mt-1">ریپورت و پیشنهادها در وضعیت عادی</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-admin-text-primary">صف‌های رسیدگی</h2>
          </div>
          <RiskRow
            href="/admin/comments/reports?resolved=false"
            label="ریپورت کامنت"
            value={commentReports}
            icon={MessageSquare}
            urgent={commentReports >= 3}
          />
          <RiskRow
            href="/admin/comments/item-reports?resolved=false"
            label="ریپورت آیتم"
            value={itemReports}
            icon={Package}
            urgent={itemReports >= 3}
          />
          <RiskRow
            href="/admin/suggestions"
            label="پیشنهاد در انتظار"
            value={pendingSuggestions}
            icon={Lightbulb}
            urgent={pendingSuggestions >= 10}
          />
        </div>
      )}

      {suggestions && (
        <section className="rounded-2xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/40 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-admin-text-primary mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            آمار پیشنهادها امروز
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <p className="text-xl font-bold text-amber-600">{suggestions.pendingTotal.toLocaleString('fa-IR')}</p>
              <p className="text-xs text-admin-text-tertiary">در انتظار</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <p className="text-xl font-bold text-emerald-600">{suggestions.approvedToday.toLocaleString('fa-IR')}</p>
              <p className="text-xs text-admin-text-tertiary">تأیید</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <p className="text-xl font-bold text-red-600">{suggestions.rejectedToday.toLocaleString('fa-IR')}</p>
              <p className="text-xs text-admin-text-tertiary">رد</p>
            </div>
          </div>
          {(suggestions.pendingItems > 0 || suggestions.pendingLists > 0) && (
            <p className="text-xs text-admin-text-tertiary mt-3">
              آیتم: {suggestions.pendingItems.toLocaleString('fa-IR')} · لیست:{' '}
              {suggestions.pendingLists.toLocaleString('fa-IR')}
            </p>
          )}
        </section>
      )}

      <Link
        href="/admin/comments"
        className="inline-flex text-sm text-violet-600 dark:text-violet-400 hover:underline"
      >
        مرکز مدیریت کامنت‌ها
      </Link>
    </div>
  );
}
