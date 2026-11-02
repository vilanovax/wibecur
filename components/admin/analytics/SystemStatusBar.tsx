'use client';

import type {
  UserGrowthHealth,
  ContentEngineHealth,
  TrendingHealth,
  AnalyticsRangeDays,
} from '@/lib/admin/analytics-metrics';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { faNumber } from '@/lib/utils';

export type SystemStatus = 'stable' | 'attention' | 'risk';

function getSystemStatus(
  userGrowth: UserGrowthHealth,
  contentEngine: ContentEngineHealth,
  trending: TrendingHealth
): { status: SystemStatus; summary: string } {
  const { activeUsers, growthRate } = userGrowth;
  const { newLists, percentListsZeroSaves } = contentEngine;
  const { trendDistributionIndex } = trending;

  const growthLow = activeUsers === 0 || growthRate < -10;
  const contentLow = newLists === 0;
  const algorithmRisk = trendDistributionIndex >= 60;

  if (activeUsers > 0 && newLists > 0 && trendDistributionIndex < 60) {
    return {
      status: 'stable',
      summary:
        growthRate > 5
          ? 'رشد کاربر و تولید محتوا در وضعیت خوب است.'
          : growthRate >= -5
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
    if (growthLow && activeUsers === 0) {
      parts.push('فعالیت کاربری در این بازه نداشته‌اید');
    } else if (growthLow) {
      parts.push('رشد کاربر منفی است');
    }
    if (contentLow) parts.push('تولید لیست جدید ندارید');
    return {
      status: 'attention',
      summary:
        parts.length > 0
          ? `${parts.join('؛ ')}.`
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
  windowDays: AnalyticsRangeDays;
}

const STATUS_CONFIG: Record<
  SystemStatus,
  { label: string; icon: typeof CheckCircle; className: string }
> = {
  stable: {
    label: 'پایدار',
    icon: CheckCircle,
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  attention: {
    label: 'نیاز به توجه',
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  risk: {
    label: 'ریسک الگوریتم',
    icon: XCircle,
    className: 'bg-red-50 text-red-800 border-red-200',
  },
};

export default function SystemStatusBar({
  userGrowth,
  contentEngine,
  trending,
  windowDays,
}: SystemStatusBarProps) {
  const { status, summary } = getSystemStatus(
    userGrowth,
    contentEngine,
    trending
  );
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <section
      className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
      dir="rtl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-snug text-(--color-text)">
            وضعیت کلی · {faNumber(windowDays)} روز اخیر
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-wibe-secondary">
            {summary}
          </p>
        </div>
        <span
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium ${config.className}`}
        >
          <Icon className="size-4" strokeWidth={1.5} />
          {config.label}
        </span>
      </div>
    </section>
  );
}
