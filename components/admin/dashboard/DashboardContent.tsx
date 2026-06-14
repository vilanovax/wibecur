'use client';

import { Suspense } from 'react';
import AdminTopBar from './AdminTopBar';
import DashboardPeriodKpis from './DashboardPeriodKpis';
import SystemPulseBar from './SystemPulseBar';
import DashboardActionCenter from './DashboardActionCenter';
import TrendingRadar from './TrendingRadar';
import CategoryIntelligenceGrid from './CategoryIntelligenceGrid';
import CuratorIntelligence from './CuratorIntelligence';
import SuggestionsQueueWidget from './SuggestionsQueueWidget';
import ActivityStream from './ActivityStream';
import type { DashboardData } from '@/lib/admin/types';

interface DashboardContentProps {
  data: DashboardData;
}

export default function DashboardContent({ data }: DashboardContentProps) {
  const {
    kpis,
    periodLabel,
    range,
    systemPulse,
    trendingRadar,
    categoryIntelligence,
    curatorIntelligence,
    riskAlerts,
    commentsModeration,
    activities,
    actionQueue,
    suggestionPreviews,
  } = data;

  const pendingSuggestionCount =
    actionQueue.find((a) => a.id === 'action-suggestions')?.count ?? 0;

  const normalizedActivities = activities.map((a) => ({
    ...a,
    timestamp: typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp,
  }));

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="h-[72px] animate-pulse bg-[var(--color-border-muted)] rounded-2xl" />
        }
      >
        <AdminTopBar initialRange={range} />
      </Suspense>

      {/* مرکز اقدام بالاتر از متریک‌های منفعل — کارِ اصلی ادمین «خالی‌کردن صف‌ها»ست */}
      <DashboardActionCenter
        actionQueue={actionQueue}
        comments={commentsModeration}
        riskAlerts={riskAlerts}
      />

      <section>
        <SystemPulseBar cards={systemPulse} />
      </section>

      {/* همیشه رندر می‌شود (با empty state) تا IA و لینک ورود به صف ثابت بماند */}
      <SuggestionsQueueWidget
        count={pendingSuggestionCount}
        previews={suggestionPreviews}
      />

      {/* KPIهای دوره‌ای تحلیلی‌اند، نه عملیاتی — پایین‌تر از اقدام/نبض */}
      <DashboardPeriodKpis kpis={kpis} periodLabel={periodLabel} range={range} />

      <section className="min-h-[320px]">
        <TrendingRadar rows={trendingRadar} />
      </section>

      <section>
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          عملکرد دسته‌ها
        </h2>
        <CategoryIntelligenceGrid categories={categoryIntelligence} />
      </section>

      <section>
        <CuratorIntelligence curators={curatorIntelligence} />
      </section>

      <section>
        <ActivityStream events={normalizedActivities} />
      </section>
    </div>
  );
}
