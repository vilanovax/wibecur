'use client';

import type {
  UserGrowthHealth,
  ContentEngineHealth,
  TrendingHealth,
} from '@/lib/admin/analytics-metrics';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export type SystemStatus = 'stable' | 'attention' | 'risk';

function getSystemStatus(
  userGrowth: UserGrowthHealth,
  contentEngine: ContentEngineHealth,
  trending: TrendingHealth
): { status: SystemStatus; summary: string } {
  const { activeUsers7d, growthRateWoW } = userGrowth;
  const { newLists7d, percentListsZeroSaves } = contentEngine;
  const { trendDistributionIndex } = trending;

  const growthLow = activeUsers7d === 0 || growthRateWoW < -10;
  const contentLow = newLists7d === 0;
  const algorithmRisk = trendDistributionIndex >= 60;

  if (activeUsers7d > 0 && newLists7d > 0 && trendDistributionIndex < 60) {
    return {
      status: 'stable',
      summary:
        growthRateWoW > 5
          ? 'رشد کاربر و تولید محتوا در وضعیت خوب است.'
          : growthRateWoW >= -5
            ? 'رشد کاربر پایدار است و سیستم در وضعیت متعادل.'
            : 'رشد کاربر کاهشی است؛ تولید محتوا فعال است.',
    };
  }

  if (algorithmRisk) {
    return {
      status: 'risk',
      summary:
        'تمرکز ذخیره‌ها روی تعداد کمی لیست بالاست. ریسک بایاس الگوریتم وجود دارد.',
    };
  }

  if (growthLow || contentLow) {
    const parts: string[] = [];
    if (growthLow && activeUsers7d === 0) parts.push('فعالیت کاربری در ۷ روز اخیر نداشته‌اید');
    else if (growthLow) parts.push('رشد کاربر منفی است');
    if (contentLow) parts.push('تولید لیست جدید ندارید');
    return {
      status: 'attention',
      summary:
        parts.length > 0
          ? `نیاز به توجه: ${parts.join('؛ ')}.`
          : percentListsZeroSaves > 40
            ? 'تولید محتوا پایین است یا سهم لیست‌های بدون ذخیره بالاست.'
            : 'وضعیت سیستم نیاز به بررسی دارد.',
    };
  }

  return {
    status: 'attention',
    summary: 'وضعیت کلی سیستم نیاز به توجه دارد.',
  };
}

interface SystemStatusBarProps {
  userGrowth: UserGrowthHealth;
  contentEngine: ContentEngineHealth;
  trending: TrendingHealth;
}

const STATUS_CONFIG: Record<
  SystemStatus,
  { label: string; icon: typeof CheckCircle; bg: string; text: string; border: string }
> = {
  stable: {
    label: 'پایدار',
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  attention: {
    label: 'نیاز به توجه',
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  risk: {
    label: 'ریسک الگوریتم',
    icon: XCircle,
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
};

export default function SystemStatusBar({
  userGrowth,
  contentEngine,
  trending,
}: SystemStatusBarProps) {
  const { status, summary } = getSystemStatus(userGrowth, contentEngine, trending);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <section
      className="rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
      style={{ direction: 'rtl' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">وضعیت کلی سیستم</h2>
          <p className="text-sm text-slate-600 dark:text-[var(--color-text-subtle)] mt-1">{summary}</p>
        </div>
        <div className="flex-shrink-0">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}
          >
            <Icon className="w-5 h-5" />
            {config.label}
          </span>
        </div>
      </div>
    </section>
  );
}
