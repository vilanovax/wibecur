'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Tag, Lightbulb, Clock } from 'lucide-react';
import PulseLiveTrending from '@/components/admin/pulse/PulseLiveTrending';
import AdminLiveFeed from '@/components/admin/pulse/AdminLiveFeed';
import TodaySnapshotCards from '@/components/admin/pulse/TodaySnapshotCards';
import PulsePageToolbar from '@/components/admin/pulse/PulsePageToolbar';
import PulseActionRequired from '@/components/admin/pulse/PulseActionRequired';
import PulseSevenDayChart from '@/components/admin/pulse/PulseSevenDayChart';
import PulseRiskPanel from '@/components/admin/pulse/PulseRiskPanel';
import PulsePeriodCompare from '@/components/admin/pulse/PulsePeriodCompare';
import PulseReportActions, {
  buildPulseReportFromDashboard,
} from '@/components/admin/pulse/PulseReportActions';
import PulseCitiesNotice from '@/components/admin/pulse/PulseCitiesNotice';
import { usePulseTabShortcuts } from '@/components/admin/pulse/usePulseTabShortcuts';
import { parsePulseTab } from '@/lib/admin/pulse-types';
import {
  derivePulseHealth,
  fetchJson,
  buildPeriodCompare,
  type DayStat,
  type PulseRisk,
  type SuggestionHealth,
} from '@/lib/admin/pulse-utils';

interface OverviewData {
  todaySaves: number;
  todayComments: number;
  activeUsersToday: number;
  newUsersToday: number;
  todayInteractions: number;
  todayLists?: number;
  yesterdaySaves?: number;
  yesterdayComments?: number;
  yesterdayLists?: number;
  newUsersYesterday?: number;
  dailyStats: DayStat[];
  chartStats?: DayStat[];
  risk?: PulseRisk;
  lastSync?: string;
}

interface CategoryGrowth {
  id: string;
  name: string;
  icon: string;
  slug: string;
  growthPercent: number;
  activeListsCount?: number;
}

interface TrendingListRow {
  rank: number;
  listId: string;
  title: string;
  slug: string;
  score: number;
  categorySlug?: string;
  badge?: string;
}

interface PulseData {
  overview: OverviewData | null;
  trendingLists: TrendingListRow[];
  categories: CategoryGrowth[];
  suggestions: SuggestionHealth | null;
}

async function fetchPulseData(): Promise<PulseData> {
  const [overview, trendingLists, categories, suggestions] = await Promise.all([
    fetchJson<OverviewData>('/api/admin/pulse/overview'),
    fetchJson<TrendingListRow[]>('/api/admin/pulse/trending-lists'),
    fetchJson<CategoryGrowth[]>('/api/admin/pulse/categories'),
    fetchJson<SuggestionHealth>('/api/admin/pulse/suggestions'),
  ]);
  return {
    overview,
    trendingLists: trendingLists ?? [],
    categories: categories ?? [],
    suggestions,
  };
}

const panelClass =
  'rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/40 p-3 shadow-sm';

export default function PulseDashboardClient() {
  const searchParams = useSearchParams();
  const activeTab = parsePulseTab(searchParams.get('tab'));
  usePulseTabShortcuts();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch, isError } = useQuery({
    queryKey: ['admin', 'pulse'],
    queryFn: fetchPulseData,
    staleTime: 60 * 1000,
    // داده واقعاً «زنده» شود — هر ۶۰ث، اما فقط وقتی تب در پیش‌زمینه است
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  });

  const overview = data?.overview ?? null;
  const trendingLists = data?.trendingLists ?? [];
  const categories = data?.categories ?? [];
  const suggestions = data?.suggestions ?? null;
  const health = derivePulseHealth(overview?.risk, suggestions);
  const riskBadge =
    (overview?.risk?.reportsPending ?? 0) + (suggestions?.pendingTotal ?? 0);

  const handleRefresh = () => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ['admin', 'pulse'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-12 rounded-xl bg-admin-muted" />
        <div className="h-8 rounded-lg bg-admin-muted w-48" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-admin-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && !overview) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm">
        <p className="text-red-800 font-medium">خطا در بارگذاری پالس وایب</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-lg bg-violet-600 text-white px-3 py-1.5 text-xs"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  const dailyStats: DayStat[] = (overview?.dailyStats ?? []).map((d) => ({
    ...d,
    lists: d.lists ?? 0,
  }));
  const chartStats: DayStat[] = (overview?.chartStats ?? dailyStats.slice(-7)).map((d) => ({
    ...d,
    lists: d.lists ?? 0,
  }));
  const periodCompare = buildPeriodCompare(dailyStats);
  const trendingCompact = trendingLists.map((t) => ({
    listId: t.listId,
    title: t.title,
    rank: t.rank,
    score: t.score,
  }));

  const pulseReport = buildPulseReportFromDashboard({
    overview: {
      todaySaves: overview?.todaySaves ?? 0,
      todayComments: overview?.todayComments ?? 0,
      activeUsersToday: overview?.activeUsersToday ?? 0,
      newUsersToday: overview?.newUsersToday ?? 0,
      todayLists: overview?.todayLists,
      todayInteractions: overview?.todayInteractions ?? 0,
      lastSync: overview?.lastSync,
      risk: overview?.risk,
    },
    health,
    dailyStats,
    periodCompare,
    suggestions,
    trendingLists,
  });

  const lastSync = overview?.lastSync ?? new Date().toISOString();

  return (
    <div className="space-y-2 -mt-1">
      <PulsePageToolbar
        activeTab={activeTab}
        riskBadge={riskBadge}
        health={health}
        activeUsers={overview?.activeUsersToday ?? 0}
        interactions24h={overview?.todayInteractions ?? 0}
        lastSync={lastSync}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
      />

      {activeTab === 'live' && (
        <div className="space-y-2">
          <PulseActionRequired risk={overview?.risk} suggestions={suggestions} />

          <TodaySnapshotCards
            activeUsers={overview?.activeUsersToday ?? 0}
            newUsersToday={overview?.newUsersToday ?? 0}
            todaySaves={overview?.todaySaves ?? 0}
            todayComments={overview?.todayComments ?? 0}
            todayLists={overview?.todayLists ?? 0}
            yesterdaySaves={overview?.yesterdaySaves ?? 0}
            yesterdayComments={overview?.yesterdayComments ?? 0}
            yesterdayLists={overview?.yesterdayLists ?? 0}
            dailyStats={chartStats}
          />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 items-start">
            <div className="xl:col-span-7 space-y-2 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {chartStats.length > 0 && (
                  <PulseSevenDayChart dailyStats={chartStats} compact />
                )}
                <PulseLiveTrending lists={trendingCompact} dense />
              </div>
            </div>
            <div className="xl:col-span-5 min-w-0">
              <AdminLiveFeed />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PulseReportActions stats={dailyStats} report={pulseReport} />
          </div>

          <PulsePeriodCompare periodCompare={periodCompare} />
          <PulseCitiesNotice />

          {chartStats.length > 0 && <PulseSevenDayChart dailyStats={chartStats} compact />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <section className={panelClass}>
              <h2 className="text-xs font-semibold text-admin-text-primary mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                الان وایب روی ایناست
              </h2>
              {trendingLists.length === 0 ? (
                <p className="text-admin-text-tertiary text-xs">داده‌ای نیست</p>
              ) : (
                <ul className="space-y-0.5 max-h-[280px] overflow-y-auto">
                  {trendingLists.map((t) => (
                    <li key={t.listId}>
                      <Link
                        href={`/admin/lists/${t.listId}/edit`}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-admin-muted text-xs"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-100 text-[10px] font-bold text-violet-700">
                          {t.rank}
                        </span>
                        <span className="flex-1 truncate font-medium">{t.title}</span>
                        <span className="text-[10px] text-admin-text-tertiary tabular-nums">
                          {t.score.toLocaleString('fa-IR')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={panelClass}>
              <h2 className="text-xs font-semibold text-admin-text-primary mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-violet-500" />
                مومنتوم دسته‌ها
              </h2>
              {categories.length === 0 ? (
                <p className="text-admin-text-tertiary text-xs">داده‌ای نیست</p>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {categories.slice(0, 8).map((cat) => (
                    <div key={cat.id}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium truncate">{cat.name}</span>
                        <span className="text-admin-text-tertiary shrink-0 ms-2">
                          {cat.growthPercent >= 0 ? '+' : ''}
                          {cat.growthPercent}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-admin-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, cat.growthPercent + 50))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className={panelClass}>
            <h2 className="text-xs font-semibold text-admin-text-primary mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              سلامت پیشنهادها
            </h2>
            {suggestions ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: suggestions.pendingTotal, l: 'انتظار', c: 'text-amber-600 bg-amber-500/10' },
                  { v: suggestions.approvedToday, l: 'تأیید', c: 'text-emerald-600 bg-emerald-500/10' },
                  { v: suggestions.rejectedToday, l: 'رد', c: 'text-red-600 bg-red-500/10' },
                ].map((x) => (
                  <div key={x.l} className={`text-center py-2 rounded-lg ${x.c}`}>
                    <p className="text-lg font-bold tabular-nums">{x.v.toLocaleString('fa-IR')}</p>
                    <p className="text-[10px] text-admin-text-tertiary">{x.l}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-admin-text-tertiary">داده‌ای نیست</p>
            )}
            <Link
              href="/admin/suggestions"
              className="inline-flex items-center gap-1 mt-2 text-xs text-violet-600 hover:underline"
            >
              <Clock className="w-3 h-3" />
              مدیریت پیشنهادها
            </Link>
          </section>
        </div>
      )}

      {activeTab === 'risk' && (
        <PulseRiskPanel risk={overview?.risk} suggestions={suggestions} health={health} />
      )}
    </div>
  );
}
