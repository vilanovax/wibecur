import nextDynamic from 'next/dynamic';
import { requireAdmin } from '@/lib/auth';
import { getCachedAnalyticsOverview } from '@/lib/admin/analytics-metrics-cached';
import {
  buildAnalyticsActions,
  parseAnalyticsRange,
} from '@/lib/admin/analytics-metrics';

const AnalyticsDashboard = nextDynamic(
  () => import('@/components/admin/analytics/AnalyticsDashboard'),
  {
    loading: () => (
      <div
        className="h-128 animate-pulse rounded-2xl bg-(--color-border-muted)"
        aria-hidden
      />
    ),
  }
);

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdmin();

  const { range: rangeRaw } = await searchParams;
  const windowDays = parseAnalyticsRange(rangeRaw);
  const overview = await getCachedAnalyticsOverview(windowDays);
  const actions = buildAnalyticsActions(overview);

  return (
    <AnalyticsDashboard
      userGrowth={overview.userGrowth}
      contentEngine={overview.contentEngine}
      trending={overview.trending}
      chart30d={overview.chart30d}
      pendingSuggestions={overview.pendingSuggestions}
      windowDays={windowDays}
      actions={actions}
    />
  );
}
