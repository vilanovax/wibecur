'use client';

import type {
  UserGrowthHealth,
  ContentEngineHealth,
  TrendingHealth,
  ChartDay,
} from '@/lib/admin/analytics-metrics';
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
}

export default function AnalyticsDashboard({
  userGrowth,
  contentEngine,
  trending,
  chart30d,
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6 max-w-5xl" style={{ direction: 'rtl' }}>
      <SystemStatusBar
        userGrowth={userGrowth}
        contentEngine={contentEngine}
        trending={trending}
      />

      <GrowthBlock data={userGrowth} />

      <ContentBlock data={contentEngine} />

      <AlgorithmHealthBlock data={trending} />

      <CombinedChart data={chart30d} />
    </div>
  );
}
