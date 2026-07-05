'use client';

import { Suspense, useMemo } from 'react';
import AdminTopBar from './AdminTopBar';
import DashboardActionCenter from './DashboardActionCenter';
import ContentOverviewStrip from './ContentOverviewStrip';
import DashboardPeriodChips from './DashboardPeriodChips';
import TrendingRadar from './TrendingRadar';
import CategoryIntelligenceGrid from './CategoryIntelligenceGrid';
import TopContentPanels from './TopContentPanels';
import SuggestionsQueueWidget from './SuggestionsQueueWidget';
import ActivityStream from './ActivityStream';
import type { DashboardData } from '@/lib/admin/types';

interface DashboardContentProps {
  data: DashboardData;
}

export default function DashboardContent({ data }: DashboardContentProps) {
  const {
    contentOverview,
    periodSnapshot,
    systemPulse,
    trendingRadar,
    categoryIntelligence,
    topLists,
    topCategories,
    riskAlerts,
    commentsModeration,
    activities,
    actionQueue,
    suggestionPreviews,
  } = data;

  const pendingSuggestionCount =
    actionQueue.find((a) => a.id === 'action-suggestions')?.count ?? 0;

  const normalizedActivities = useMemo(
    () =>
      activities
        .filter((a) => a.type === 'list_created' || a.type === 'item_added')
        .map((a) => ({
          ...a,
          timestamp:
            typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp,
        })),
    [activities]
  );

  const pulseChips = systemPulse.map((c) => ({
    label: c.label,
    value: c.value,
  }));

  return (
    <div className="space-y-5">
      <Suspense
        fallback={
          <div className="h-[72px] animate-pulse bg-[var(--color-border-muted)] rounded-2xl" />
        }
      >
        <AdminTopBar initialRange={periodSnapshot.range} />
      </Suspense>

      <DashboardActionCenter
        actionQueue={actionQueue}
        comments={commentsModeration}
        riskAlerts={riskAlerts}
      />

      <ContentOverviewStrip overview={contentOverview} />

      <DashboardPeriodChips snapshot={periodSnapshot} pulseCards={pulseChips} />

      <section className="min-h-[280px]">
        <TrendingRadar rows={trendingRadar} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <section className="xl:col-span-2 space-y-3">
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            عملکرد دسته‌ها
          </h2>
          <CategoryIntelligenceGrid categories={categoryIntelligence} />
        </section>

        <TopContentPanels topLists={topLists} topCategories={topCategories} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {pendingSuggestionCount > 0 && (
          <SuggestionsQueueWidget
            count={pendingSuggestionCount}
            previews={suggestionPreviews}
          />
        )}

        {normalizedActivities.length > 0 && (
          <section className={pendingSuggestionCount > 0 ? '' : 'lg:col-span-2'}>
            <ActivityStream events={normalizedActivities} />
          </section>
        )}
      </div>
    </div>
  );
}
