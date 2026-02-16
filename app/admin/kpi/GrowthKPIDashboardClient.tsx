'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Award,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from 'lucide-react';

type Severity = 'positive' | 'neutral' | 'negative';
function getSeverity(growthPercent: number | undefined): Severity {
  if (growthPercent == null) return 'neutral';
  if (growthPercent > 0) return 'positive';
  if (growthPercent < 0) return 'negative';
  return 'neutral';
}
const SEVERITY_BORDER: Record<Severity, string> = {
  positive: 'border-l-green-500',
  neutral: 'border-l-amber-400',
  negative: 'border-l-red-500',
};
const SEVERITY_TEXT: Record<Severity, string> = {
  positive: 'text-green-700 dark:text-green-400',
  neutral: 'text-amber-700 dark:text-amber-400',
  negative: 'text-red-700 dark:text-red-400',
};

function KpiCard({
  label,
  value,
  growthPercent,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  growthPercent?: number;
  className?: string;
}) {
  const severity = getSeverity(growthPercent);
  return (
    <div
      className={`rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-admin-border dark:border-gray-600 border-l-4 p-4 ${SEVERITY_BORDER[severity]} ${className}`}
    >
      <p className="text-[11px] font-semibold text-admin-text-tertiary dark:text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-admin-text-primary dark:text-white tabular-nums">{value}</p>
      {growthPercent != null && (
        <p className={`text-xs mt-1.5 font-medium ${SEVERITY_TEXT[severity]}`}>
          {growthPercent >= 0 ? '+' : ''}{growthPercent}% نسبت به هفته قبل
        </p>
      )}
    </div>
  );
}

function SystemHealthBanner({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const config = {
    healthy: { icon: ShieldCheck, label: 'سالم', className: 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300' },
    warning: { icon: ShieldAlert, label: 'هشدار', className: 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200' },
    critical: { icon: ShieldX, label: 'بحرانی', className: 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300' },
  };
  const { icon: Icon, label, className } = config[status];
  return (
    <div className={`rounded-xl px-6 py-4 flex items-center justify-between border ${className}`}>
      <span className="flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5" />
        وضعیت سیستم: {label}
      </span>
    </div>
  );
}

function getSystemHealth(data: GrowthData): 'healthy' | 'warning' | 'critical' {
  const pulseOutOf10 = data.pulseScore / 10;
  const weeklyChange = data.pulseScoreWeeklyChange ?? 0;
  const kpiCards = data.kpiCards ?? [];
  const negativeCount = kpiCards.filter((c) => c.growthPercent < 0).length;
  const totalWithGrowth = kpiCards.length;
  const decliningRatio = totalWithGrowth > 0 ? negativeCount / totalWithGrowth : 0;
  if (pulseOutOf10 < 3 || decliningRatio >= 0.7) return 'critical';
  if (weeklyChange < 0 && pulseOutOf10 < 5) return 'warning';
  if (decliningRatio >= 0.5) return 'warning';
  return 'healthy';
}

interface GrowthData {
  pulseScore: number;
  pulseScoreWeeklyChange?: number;
  pulseStatus?: 'up' | 'down' | 'stable';
  pulseBreakdown?: {
    engagement: number;
    retention: number;
    contentGrowth: number;
    creatorActivity: number;
  };
  activeUsers7d?: number;
  newLists7d?: number;
  suggestionApprovalRate?: number;
  overview: {
    activeUsersToday: number;
    savesToday: number;
    newListsToday: number;
    suggestionsPending: number;
  };
  engagementScore: number;
  engagementDetail: {
    savesWeek: number;
    suggestionsWeek: number;
    commentsWeek: number;
    listsCreatedWeek: number;
  };
  retention: {
    d1Retention: number;
    d7Retention: number;
    d30Retention?: number;
  };
  topMovers: {
    topListsWeek: { id: string; title: string; slug: string; saves: number }[];
    topItemsByVotes: { id: string; title: string; votes: number }[];
    fastestCategory: { id: string; name: string; icon: string; slug: string; growth: number } | null;
  };
  creatorSpotlight: {
    topListsBySave: { id: string; title: string; slug: string; saveCount: number; categories: { name: string; icon: string } | null }[];
    topCreators: { userId: string; name: string | null; saves: number; lists: number }[];
  };
  suggestionQualityRate: number;
  charts?: {
    activeUsersLast30Days: { date: string; count: number }[];
    savesVsListsLast30Days?: { date: string; saves: number; lists: number }[];
    savesVsSuggestionsLast14: { date: string; saves: number; suggestions: number }[];
    newListsPerWeek: { weekLabel: string; count: number }[];
  };
  kpiCards?: {
    key: string;
    label: string;
    value: number;
    series7d: { date: string; value: number }[];
    growthPercent: number;
  }[];
  trendingItems?: { id: string; title: string; imageUrl: string | null; velocity: number; saveCount: number }[];
  fastestGrowingCategories?: { id: string; name: string; icon: string; slug: string; growth: number; savesThisWeek: number }[];
  suggestionPanel?: { pendingCount: number; approvalRate: number; avgApprovalTimeHours: number };
  creatorStats?: { listsWith50PlusSaves: number; pctUsersWith2PlusLists: number };
  activityFeed?: { type: string; userId: string; userName: string | null; targetTitle: string | null; createdAt: string }[];
}

export default function GrowthKPIDashboard() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/kpi/growth')
      .then((r) => r.json())
      .then((json) => { if (json.data) setData(json.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 py-2 max-w-[1400px] mx-auto" dir="rtl">
        <div className="h-20 rounded-xl border border-admin-border dark:border-gray-600 bg-admin-muted dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-admin-border dark:border-gray-600 h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-admin-border dark:border-gray-600 h-48 animate-pulse" />
          <div className="rounded-xl border border-admin-border dark:border-gray-600 h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6 text-center" dir="rtl">
        <p className="text-amber-800 dark:text-amber-200">خطا در بارگذاری داده‌های KPI</p>
      </div>
    );
  }

  const pulseOutOf10 = Math.round((data.pulseScore / 10) * 10) / 10;
  const weeklyChange = data.pulseScoreWeeklyChange ?? 0;
  const status = data.pulseStatus ?? (weeklyChange > 0 ? 'up' : weeklyChange < 0 ? 'down' : 'stable');
  const breakdown = data.pulseBreakdown ?? {
    engagement: 0,
    retention: 0,
    contentGrowth: 0,
    creatorActivity: 0,
  };

  const statusLabel = status === 'up' ? 'صعودی' : status === 'down' ? 'نزولی' : 'پایدار';

  const savesPerUserCard = data.kpiCards?.find((c) => c.key === 'savesPerActiveUser');
  const commentRateCard = data.kpiCards?.find((c) => c.key === 'commentRate');
  const activeUsersPctCard = data.kpiCards?.find((c) => c.key === 'weeklyEngagedUsersPct');

  const systemHealth = getSystemHealth(data);
  const pendingSuggestions = data.overview.suggestionsPending ?? data.suggestionPanel?.pendingCount ?? 0;
  const hasRisk = pendingSuggestions > 0;

  const categoriesWithBadge = useMemo(() => {
    const list = data.fastestGrowingCategories ?? [];
    return list.map((cat) => ({
      ...cat,
      status: (cat.growth >= 30 ? 'fast' : cat.growth >= 10 ? 'stable' : 'low') as 'fast' | 'stable' | 'low',
    }));
  }, [data.fastestGrowingCategories]);

  const showRetention =
    data.retention.d1Retention > 0 || data.retention.d7Retention > 0 || (data.retention.d30Retention ?? 0) > 0;

  const topCreator = data.creatorSpotlight.topCreators[0];
  const creatorsWith5PlusSaves = data.creatorStats?.listsWith50PlusSaves ?? 0;
  const pctPowerCreators = data.creatorStats?.pctUsersWith2PlusLists ?? 0;

  const subMetricClass = (val: number) =>
    val === 0
      ? 'text-gray-400 dark:text-gray-500'
      : 'text-white/95 dark:text-gray-100';

  return (
    <div className="space-y-8 py-2 max-w-[1400px] mx-auto" dir="rtl">
      {/* 1. System Health */}
      <section>
        <SystemHealthBanner status={systemHealth} />
      </section>

      {/* 2. Pulse — compact */}
      <section className="rounded-xl border border-admin-border dark:border-gray-600 bg-gradient-to-br from-violet-500/90 via-purple-500/85 to-indigo-600/90 dark:from-violet-600/80 dark:to-indigo-700/80 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold tabular-nums text-white">
              {pulseOutOf10} <span className="text-sm font-normal text-white/70">/ 10</span>
            </div>
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2 text-white">
                <Zap className="h-4 w-4 text-amber-200/90" />
                Pulse Score
              </h2>
              <p className="text-white/80 text-sm mt-0.5">
                {weeklyChange !== 0 && (
                  <span className={weeklyChange > 0 ? 'text-emerald-200' : 'text-amber-200'}>
                    {weeklyChange > 0 ? <TrendingUp className="h-3.5 w-3.5 inline" /> : <TrendingDown className="h-3.5 w-3.5 inline" />}
                    {' '}{weeklyChange > 0 ? '+' : ''}{weeklyChange} نسبت به هفته قبل
                  </span>
                )}
                <span className="text-white/90"> · {statusLabel}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 flex-1 md:max-w-sm">
            {[
              { label: 'Engagement', value: breakdown.engagement },
              { label: 'Retention', value: breakdown.retention },
              { label: 'Content', value: breakdown.contentGrowth },
              { label: 'Creator', value: breakdown.creatorActivity },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-white/5 border border-white/10 py-1.5 px-2 text-center">
                <p className="text-white/55 text-[10px] uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-semibold tabular-nums ${subMetricClass(value)}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. KPI Strip — white cards, border-l severity */}
      <section>
        <h2 className="text-xs font-semibold text-admin-text-tertiary dark:text-gray-500 uppercase tracking-wider mb-4">خلاصه KPI</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="کاربران فعال (۷ روز)"
            value={(data.activeUsers7d ?? activeUsersPctCard?.value ?? 0).toLocaleString('fa-IR')}
            growthPercent={activeUsersPctCard?.growthPercent}
          />
          <KpiCard label="لیست جدید (۷ روز)" value={(data.newLists7d ?? 0).toLocaleString('fa-IR')} />
          <KpiCard
            label="ذخیره به ازای کاربر"
            value={savesPerUserCard ? savesPerUserCard.value.toLocaleString('fa-IR') : '—'}
            growthPercent={savesPerUserCard?.growthPercent}
          />
          <KpiCard
            label="نرخ کامنت"
            value={commentRateCard ? commentRateCard.value.toLocaleString('fa-IR') : '—'}
            growthPercent={commentRateCard?.growthPercent}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <KpiCard
            label="نرخ تأیید پیشنهاد"
            value={`${(data.suggestionApprovalRate ?? data.suggestionPanel?.approvalRate ?? data.suggestionQualityRate ?? 0)}%`}
          />
          <KpiCard label="دسته‌های رشد سریع" value={data.fastestGrowingCategories?.length ?? 0} />
        </div>
      </section>

      {/* 4. Risk & Alerts */}
      {hasRisk && (
        <section>
          <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-red-800 dark:text-red-200 font-semibold">
              <AlertTriangle className="h-5 w-5" />
              پیشنهادات در انتظار بررسی
            </span>
            <span className="text-lg font-bold text-red-700 dark:text-red-300 tabular-nums">{pendingSuggestions}</span>
          </div>
        </section>
      )}

      {/* 5. Category Intelligence — با بج وضعیت */}
      <section>
        <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white uppercase tracking-wider mb-4">هوش دسته‌بندی</h2>
        {categoriesWithBadge.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesWithBadge.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border border-admin-border dark:border-gray-600 p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      cat.status === 'fast'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : cat.status === 'stable'
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                    }`}
                  >
                    {cat.status === 'fast' && '🔥 رشد سریع'}
                    {cat.status === 'stable' && 'پایدار'}
                    {cat.status === 'low' && '⚠ تعامل پایین'}
                  </span>
                </div>
                <p className="font-medium text-admin-text-primary dark:text-white truncate">{cat.name}</p>
                <p className="text-xs text-admin-text-tertiary dark:text-gray-400 mt-1">
                  +{cat.growth}% رشد · {(cat.savesThisWeek ?? 0).toLocaleString('fa-IR')} ذخیره این هفته
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-admin-border dark:border-gray-600 bg-admin-muted dark:bg-gray-800/50 p-6 text-center text-admin-text-tertiary dark:text-gray-400 text-sm">
            داده‌ای برای دسته‌ها موجود نیست
          </div>
        )}
      </section>

      {/* 6. Trending — حداکثر ۸ ردیف، هدر sticky */}
      <section>
        <h2 className="text-xs font-semibold text-admin-text-tertiary dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Flame className="h-3.5 w-3.5" />
          برترین‌های هفته
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-admin-border dark:border-gray-600 overflow-hidden">
            <div className="px-4 py-3 border-b border-admin-border dark:border-gray-600 bg-admin-muted/50 dark:bg-gray-700/30">
              <h3 className="text-xs font-semibold text-admin-text-tertiary dark:text-gray-400 uppercase">لیست‌ها</h3>
            </div>
            <ul className="divide-y divide-admin-border dark:divide-gray-600">
              {(data.topMovers.topListsWeek ?? []).slice(0, 8).map((list, i) => (
                <li key={list.id}>
                  <Link
                    href={`/lists/${list.slug}`}
                    className="flex items-center gap-3 py-3 px-4 hover:bg-admin-muted/50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <span className="text-admin-text-tertiary dark:text-gray-500 text-xs font-medium w-6 tabular-nums">{i + 1}</span>
                    <span className="font-medium text-admin-text-primary dark:text-white truncate flex-1 min-w-0">{list.title}</span>
                    <span className="text-[10px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded tabular-nums">{list.saves}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {(!data.topMovers.topListsWeek || data.topMovers.topListsWeek.length === 0) && (
              <p className="text-sm text-admin-text-tertiary dark:text-gray-500 py-4 px-4">داده‌ای نیست</p>
            )}
          </div>
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-admin-border dark:border-gray-600 overflow-hidden">
            <div className="px-4 py-3 border-b border-admin-border dark:border-gray-600 bg-admin-muted/50 dark:bg-gray-700/30">
              <h3 className="text-xs font-semibold text-admin-text-tertiary dark:text-gray-400 uppercase">دسته‌های با رشد</h3>
            </div>
            <ul className="divide-y divide-admin-border dark:divide-gray-600">
              {(data.fastestGrowingCategories ?? []).slice(0, 8).map((cat, i) => (
                <li key={cat.id} className="flex items-center gap-3 py-3 px-4 hover:bg-admin-muted/50 dark:hover:bg-gray-700/30 transition-colors">
                  <span className="text-admin-text-tertiary dark:text-gray-500 text-xs font-medium w-6 tabular-nums">{i + 1}</span>
                  <span className="text-base">{cat.icon}</span>
                  <span className="font-medium text-admin-text-primary dark:text-white truncate flex-1">{cat.name}</span>
                  <span className="text-[10px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">+{cat.growth}%</span>
                </li>
              ))}
            </ul>
            {(!data.fastestGrowingCategories || data.fastestGrowingCategories.length === 0) && (
              <p className="text-sm text-admin-text-tertiary dark:text-gray-500 py-4 px-4">داده‌ای نیست</p>
            )}
          </div>
        </div>
      </section>

      {/* 7. نمودارها */}
      {data.charts && (data.charts.activeUsersLast30Days?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-admin-text-tertiary dark:text-gray-500 uppercase tracking-wider mb-4">نمودارهای رشد</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.charts.activeUsersLast30Days?.length > 0 && (
              <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-admin-border dark:border-gray-600 p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">کاربران فعال (۳۰ روز)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data.charts.activeUsersLast30Days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" vertical={false} strokeOpacity={0.6} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 10 }} width={32} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      formatter={(value: number) => [value.toLocaleString('fa-IR'), 'کاربر']}
                      labelFormatter={(l) => l}
                    />
                    <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {data.charts.savesVsListsLast30Days?.length > 0 && (
              <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-admin-border dark:border-gray-600 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">ذخیره vs لیست جدید (۳۰ روز)</h3>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded bg-indigo-500" /> ذخیره</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded bg-purple-500" /> لیست</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data.charts.savesVsListsLast30Days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" vertical={false} strokeOpacity={0.6} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 10 }} width={32} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      formatter={(value: number) => [value.toLocaleString('fa-IR')]}
                    />
                    <Line type="monotone" dataKey="saves" stroke="#6366F1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="lists" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 8. Creator Snapshot */}
      <section>
        <h2 className="text-xs font-semibold text-admin-text-tertiary dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Award className="h-3.5 w-3.5" />
          خلاصه سازندگان
        </h2>
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm px-4 py-2.5">
            <span className="text-xs text-admin-text-tertiary dark:text-gray-400">Power Creators</span>
            <span className="text-sm font-bold text-admin-text-primary dark:text-white tabular-nums">{creatorsWith5PlusSaves}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm px-4 py-2.5">
            <span className="text-xs text-admin-text-tertiary dark:text-gray-400">Creators 2+ Lists</span>
            <span className="text-sm font-bold text-admin-text-primary dark:text-white tabular-nums">{pctPowerCreators}%</span>
          </div>
          {topCreator && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm px-4 py-2.5">
              <span className="text-xs text-admin-text-tertiary dark:text-gray-400">Top Creator</span>
              <span className="text-sm font-bold text-admin-text-primary dark:text-white truncate max-w-[8rem]" title={topCreator.name || topCreator.userId}>
                {topCreator.name || topCreator.userId.slice(0, 8)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 9. Retention */}
      {showRetention && (
        <section>
          <h2 className="text-xs font-semibold text-admin-text-tertiary dark:text-gray-500 uppercase tracking-wider mb-3">Retention</h2>
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-admin-border dark:border-gray-600 p-4">
            <div className="flex gap-4">
              <div className="flex-1 text-center p-3 rounded-xl bg-admin-muted/50 dark:bg-gray-700/30">
                <p className="text-xl font-bold text-admin-text-primary dark:text-white">{data.retention.d1Retention}%</p>
                <p className="text-xs text-admin-text-tertiary dark:text-gray-400 mt-0.5">D1</p>
              </div>
              <div className="flex-1 text-center p-3 rounded-xl bg-admin-muted/50 dark:bg-gray-700/30">
                <p className="text-xl font-bold text-admin-text-primary dark:text-white">{data.retention.d7Retention}%</p>
                <p className="text-xs text-admin-text-tertiary dark:text-gray-400 mt-0.5">D7</p>
              </div>
              <div className="flex-1 text-center p-3 rounded-xl bg-admin-muted/50 dark:bg-gray-700/30">
                <p className="text-xl font-bold text-admin-text-primary dark:text-white">{data.retention.d30Retention ?? '-'}%</p>
                <p className="text-xs text-admin-text-tertiary dark:text-gray-400 mt-0.5">D30</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 10. Activity Feed — پیش‌فرض بسته */}
      {data.activityFeed && data.activityFeed.length > 0 && (
        <section>
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-admin-border dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setActivityOpen(!activityOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-admin-text-primary dark:text-white hover:bg-admin-muted/50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                نمایش فعالیت‌ها
              </span>
              {activityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div className={`transition-all duration-200 overflow-hidden ${activityOpen ? 'max-h-[400px]' : 'max-h-0'}`}>
              <ul className="border-t border-admin-border dark:border-gray-600 p-4 space-y-2 overflow-y-auto">
              {data.activityFeed.slice(0, 15).map((e, i) => (
                <li key={i} className="text-sm text-admin-text-secondary dark:text-gray-400 py-1">
                  {e.type === 'save' && (
                    <>
                      <span className="font-medium text-admin-text-primary dark:text-white">{e.userName || 'کاربر'}</span> لیست <span className="text-violet-600 dark:text-violet-400">{e.targetTitle || '—'}</span> را ذخیره کرد
                    </>
                  )}
                  {e.type === 'list_created' && (
                    <>
                      <span className="font-medium text-admin-text-primary dark:text-white">{e.userName || 'کاربر'}</span> لیست <span className="text-violet-600 dark:text-violet-400">{e.targetTitle || '—'}</span> ساخت
                    </>
                  )}
                  {e.type === 'suggestion_approved' && (
                    <>
                      <CheckCircle className="inline h-3.5 w-3.5 text-emerald-500 ml-0.5 align-middle" /> پیشنهاد <span className="text-violet-600 dark:text-violet-400">{e.targetTitle || '—'}</span> تأیید شد
                    </>
                  )}
                  <span className="text-admin-text-tertiary text-xs mr-1"> · {new Date(e.createdAt).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
