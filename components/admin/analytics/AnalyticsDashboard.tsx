'use client';

import Link from 'next/link';
import type {
  UserGrowthHealth,
  ContentEngineHealth,
  TrendingHealth,
  ChartDay,
  AnalyticsAction,
  AnalyticsRangeDays,
} from '@/lib/admin/analytics-metrics';
import { ANALYTICS_RANGES } from '@/lib/admin/analytics-metrics';
import { faNumber } from '@/lib/utils';
import SystemStatusBar from './SystemStatusBar';
import GrowthBlock from './GrowthBlock';
import ContentBlock from './ContentBlock';
import AlgorithmHealthBlock from './AlgorithmHealthBlock';
import CombinedChart from './CombinedChart';

interface AnalyticsDashboardProps {
  userGrowth: UserGrowthHealth;
  contentEngine: ContentEngineHealth;
  trending: TrendingHealth;
  chart30d: ChartDay[];
  pendingSuggestions: number;
  windowDays: AnalyticsRangeDays;
  actions: AnalyticsAction[];
}

export default function AnalyticsDashboard({
  userGrowth,
  contentEngine,
  trending,
  chart30d,
  pendingSuggestions,
  windowDays,
  actions,
}: AnalyticsDashboardProps) {
  return (
    <div className="max-w-5xl space-y-4" dir="rtl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-snug text-(--color-text)">
            آنالیتیکس
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-wibe-secondary">
            رشد کاربر، تولید محتوا و تمرکز ترند را در یک نگاه ببینید.
            {pendingSuggestions > 0
              ? ` ${faNumber(pendingSuggestions)} پیشنهاد در صف بررسی است.`
              : ''}
          </p>
        </div>
        <div
          role="group"
          aria-label="بازه زمانی"
          className="flex flex-wrap gap-2"
        >
          {ANALYTICS_RANGES.map((days) => {
            const active = windowDays === days;
            return (
              <Link
                key={days}
                href={`/admin/analytics?range=${days}`}
                className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium ${
                  active
                    ? 'bg-primary text-white'
                    : 'border border-(--color-border) bg-(--color-surface) text-wibe-secondary hover:bg-(--color-bg)'
                }`}
              >
                {faNumber(days)} روز
              </Link>
            );
          })}
        </div>
      </header>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="inline-flex min-h-11 items-center rounded-xl border border-(--color-border) bg-(--color-surface) px-3 text-sm font-medium text-(--color-text) hover:bg-(--color-bg)"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}

      <SystemStatusBar
        userGrowth={userGrowth}
        contentEngine={contentEngine}
        trending={trending}
        windowDays={windowDays}
      />

      <CombinedChart data={chart30d} windowDays={windowDays} />

      <GrowthBlock data={userGrowth} />

      <ContentBlock data={contentEngine} />

      <AlgorithmHealthBlock data={trending} />
    </div>
  );
}
