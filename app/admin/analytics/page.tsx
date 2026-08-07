import { requireAdmin } from '@/lib/auth';
import { getCachedAnalyticsOverview } from '@/lib/admin/analytics-metrics-cached';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';

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
