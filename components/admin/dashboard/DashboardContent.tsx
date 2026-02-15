'use client';

import AdminTopBar from './AdminTopBar';
import SystemPulseBar from './SystemPulseBar';
import TrendingRadar from './TrendingRadar';
import CategoryIntelligenceGrid from './CategoryIntelligenceGrid';
import CuratorIntelligence from './CuratorIntelligence';
import RiskModerationPanel from './RiskModerationPanel';
import ActivityStream from './ActivityStream';
import type { DashboardData } from '@/lib/admin/types';

interface DashboardContentProps {
  data: DashboardData;
}

export default function DashboardContent({ data }: DashboardContentProps) {
  const {
    systemPulse,
    trendingRadar,
    categoryIntelligence,
    curatorIntelligence,
    riskAlerts,
    activities,
  } = data;

  const normalizedActivities = activities.map((a) => ({
    ...a,
    timestamp: typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp,
  }));

  return (
    <div className="space-y-6">
      <AdminTopBar />

      {/* 1. System Pulse Bar */}
      <section>
        <SystemPulseBar cards={systemPulse} />
      </section>

      {/* 2. Trending Radar (Hero – 2x visual weight) */}
      <section className="min-h-[320px]">
        <TrendingRadar rows={trendingRadar} />
      </section>

      {/* 3. Category Intelligence – 2 columns desktop */}
      <section>
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          هوش دسته‌بندی
        </h2>
        <CategoryIntelligenceGrid categories={categoryIntelligence} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 4. Curator Intelligence */}
        <section className="lg:col-span-2">
          <CuratorIntelligence curators={curatorIntelligence} />
        </section>
        {/* 5. Risk & Moderation */}
        <section>
          <RiskModerationPanel items={riskAlerts} />
        </section>
      </div>

      {/* 6. Activity Stream */}
      <section>
        <ActivityStream events={normalizedActivities} />
      </section>
    </div>
  );
}
