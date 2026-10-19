import nextDynamic from 'next/dynamic';
import { requireAdmin } from '@/lib/auth';
import { getCachedAnalyticsOverview } from '@/lib/admin/analytics-metrics-cached';

const AnalyticsDashboard = nextDynamic(
  () => import('@/components/admin/analytics/AnalyticsDashboard'),
  {
    loading: () => (
      <div
        className="h-[32rem] animate-pulse rounded-2xl bg-[var(--color-border-muted)]"
        aria-hidden
      />
    ),
  }
);

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const overview = await getCachedAnalyticsOverview();

  return (
    <div className="max-w-5xl">
      <AnalyticsDashboard
        userGrowth={overview.userGrowth}
        contentEngine={overview.contentEngine}
        trending={overview.trending}
        chart30d={overview.chart30d}
      />
    </div>
  );
}
