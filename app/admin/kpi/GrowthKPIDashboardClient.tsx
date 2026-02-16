'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

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

function Card({ children, className = '', elevation = 'default' }: { children: React.ReactNode; className?: string; elevation?: 'default' | 'high' }) {
  return (
    <div
      className={`rounded-xl border bg-white dark:bg-gray-800 ${
        elevation === 'high'
          ? 'border-gray-200 dark:border-gray-600 shadow-md p-5'
          : 'border-gray-100 dark:border-gray-700 shadow-sm p-4'
      } ${className}`}
    >
      {children}
    </div>
  );
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
      <div className="space-y-10 py-2" dir="rtl">
        <div className="h-28 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700 h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700 h-20 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 h-72 animate-pulse" />
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[16px] border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-6 text-center" dir="rtl">
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
  const statusColor = status === 'up' ? 'text-emerald-300' : status === 'down' ? 'text-amber-300' : 'text-white/90';

  const savesPerUserCard = data.kpiCards?.find((c) => c.key === 'savesPerActiveUser');
  const commentRateCard = data.kpiCards?.find((c) => c.key === 'commentRate');
  const activeUsersPctCard = data.kpiCards?.find((c) => c.key === 'weeklyEngagedUsersPct');

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
    <div className="space-y-10 py-2" dir="rtl">
      {/* ——— 1️⃣ Pulse: کم‌رنگ‌تر، Pulse بزرگ سمت راست، ۴ شاخص کوچک و کم‌رنگ ——— */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-violet-500/90 via-purple-500/85 to-indigo-600/90 dark:from-violet-600/80 dark:to-indigo-700/80 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-center gap-4 order-2 md:order-1">
            <div className="flex h-[4.5rem] w-[4.5rem] flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-3xl font-bold tabular-nums text-white">
              {pulseOutOf10} <span className="text-base font-normal text-white/70">/ 10</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Zap className="h-5 w-5 text-amber-200/90" />
                Pulse Score
              </h1>
              <p className="text-white/75 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                {weeklyChange !== 0 && (
                  <span className={weeklyChange > 0 ? 'text-emerald-200/90' : 'text-amber-200/90'}>
                    {weeklyChange > 0 ? <TrendingUp className="h-3.5 w-3.5 inline" /> : <TrendingDown className="h-3.5 w-3.5 inline" />}
                    {' '}{weeklyChange > 0 ? '+' : ''}{weeklyChange} نسبت به هفته قبل
                  </span>
                )}
                <span className={statusColor}>وضعیت: {statusLabel}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 flex-1 md:max-w-md order-1 md:order-2">
            {[
              { label: 'Engagement', value: breakdown.engagement },
              { label: 'Retention', value: breakdown.retention },
              { label: 'Content Growth', value: breakdown.contentGrowth },
              { label: 'Creator Activity', value: breakdown.creatorActivity },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-white/5 border border-white/10 py-2 px-2 text-center">
                <p className="text-white/55 text-[10px] uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`text-sm font-semibold tabular-nums ${subMetricClass(value)}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— 2️⃣ KPI: Primary (۳ بزرگ) + Secondary (۳ کوچک‌تر) ——— */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">خلاصه KPI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card elevation="high">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">کاربران فعال (۷ روز)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {(data.activeUsers7d ?? activeUsersPctCard?.value ?? 0).toLocaleString('fa-IR')}
            </p>
            {activeUsersPctCard && (
              <p className={`text-xs mt-1.5 ${activeUsersPctCard.growthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {activeUsersPctCard.growthPercent >= 0 ? '+' : ''}{activeUsersPctCard.growthPercent}% نسبت به هفته قبل
              </p>
            )}
          </Card>
          <Card elevation="high">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">لیست جدید (۷ روز)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {(data.newLists7d ?? 0).toLocaleString('fa-IR')}
            </p>
          </Card>
          <Card elevation="high">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ذخیره به ازای کاربر</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {savesPerUserCard ? savesPerUserCard.value.toLocaleString('fa-IR') : '—'}
            </p>
            {savesPerUserCard && (
              <p className={`text-xs mt-1.5 ${savesPerUserCard.growthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {savesPerUserCard.growthPercent >= 0 ? '+' : ''}{savesPerUserCard.growthPercent}% نسبت به هفته قبل
              </p>
            )}
          </Card>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">نرخ کامنت</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
              {commentRateCard ? commentRateCard.value.toLocaleString('fa-IR') : '—'}
            </p>
            {commentRateCard && (
              <p className={`text-[11px] mt-0.5 ${commentRateCard.growthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {commentRateCard.growthPercent >= 0 ? '+' : ''}{commentRateCard.growthPercent}%
              </p>
            )}
          </Card>
          <Card>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">نرخ تأیید پیشنهاد</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
              {(data.suggestionApprovalRate ?? data.suggestionPanel?.approvalRate ?? data.suggestionQualityRate ?? 0)}%
            </p>
          </Card>
          <Card>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">دسته‌های رشد سریع</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
              {data.fastestGrowingCategories?.length ?? 0}
            </p>
            {data.topMovers.fastestCategory && (
              <p className="text-[11px] mt-0.5 text-gray-500 dark:text-gray-400 truncate" title={data.topMovers.fastestCategory.name}>
                {data.topMovers.fastestCategory.name}
              </p>
            )}
          </Card>
        </div>
      </section>

      {/* ——— 3️⃣ نمودارها: خطوط سبک، بدون لژند تکراری، tooltip مینیمال ——— */}
      {data.charts && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">نمودارهای رشد</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.charts.activeUsersLast30Days?.length > 0 && (
              <Card className="border-gray-100 dark:border-gray-700">
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
              </Card>
            )}
            {data.charts.savesVsListsLast30Days?.length > 0 && (
              <Card className="border-gray-100 dark:border-gray-700">
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
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ——— 4️⃣ Trending: رتبه + عنوان + بج سرعت کوچک، خط جداکننده ——— */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
          <Flame className="h-3.5 w-3.5" />
          Trending Intelligence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">برترین لیست‌های هفته</h3>
            {data.topMovers.topListsWeek.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.topMovers.topListsWeek.slice(0, 5).map((list, i) => (
                  <li key={list.id}>
                    <Link href={`/lists/${list.slug}`} className="flex items-center gap-3 py-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors -mx-1 px-1 rounded">
                      <span className="text-gray-400 dark:text-gray-500 text-xs font-medium w-5 tabular-nums">{i + 1}</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">{list.title}</span>
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded shrink-0 tabular-nums">{list.saves}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 py-2">داده‌ای نیست</p>
            )}
          </Card>
          <Card>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">دسته‌های با رشد سریع</h3>
            {data.fastestGrowingCategories && data.fastestGrowingCategories.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.fastestGrowingCategories.slice(0, 3).map((cat, i) => (
                  <li key={cat.id} className="flex items-center gap-3 py-2.5">
                    <span className="text-gray-400 dark:text-gray-500 text-xs font-medium w-5 tabular-nums">{i + 1}</span>
                    <span className="text-base ml-0.5">{cat.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate flex-1">{cat.name}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded shrink-0">+{cat.growth}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 py-2">داده‌ای نیست</p>
            )}
          </Card>
        </div>
      </section>

      {/* ——— 5️⃣ Creator Snapshot: ۳ stat chip ——— */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Award className="h-3.5 w-3.5" />
          Creator Snapshot
        </h2>
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Power Creators</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{creatorsWith5PlusSaves}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Creators 5+ Saves</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{pctPowerCreators}%</span>
          </div>
          {topCreator && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Top Creator</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[8rem]" title={topCreator.name || topCreator.userId}>
                {topCreator.name || topCreator.userId.slice(0, 8)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ——— 6️⃣ Retention (فقط اگر داده معنی‌دار) ——— */}
      {showRetention && (
        <section className="pt-1">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Retention</h2>
          <Card className="border-gray-100 dark:border-gray-700">
            <div className="flex gap-4">
              <div className="flex-1 text-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-700/30">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data.retention.d1Retention}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">D1</p>
              </div>
              <div className="flex-1 text-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-700/30">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data.retention.d7Retention}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">D7</p>
              </div>
              <div className="flex-1 text-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-700/30">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data.retention.d30Retention ?? '-'}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">D30</p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* ——— 7️⃣ فعالیت اخیر (collapsible) ——— */}
      {data.activityFeed && data.activityFeed.length > 0 && (
        <section className="pt-1">
        <Card className="border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setActivityOpen(!activityOpen)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              فعالیت اخیر
            </span>
            {activityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {activityOpen && (
            <ul className="mt-3 space-y-1.5 max-h-64 overflow-y-auto border-t border-gray-100 dark:border-gray-700 pt-3">
              {data.activityFeed.slice(0, 15).map((e, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 py-1 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                  {e.type === 'save' && (
                    <>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{e.userName || 'کاربر'}</span> لیست <span className="text-violet-600 dark:text-violet-400">{e.targetTitle || '—'}</span> را ذخیره کرد
                    </>
                  )}
                  {e.type === 'list_created' && (
                    <>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{e.userName || 'کاربر'}</span> لیست <span className="text-violet-600 dark:text-violet-400">{e.targetTitle || '—'}</span> ساخت
                    </>
                  )}
                  {e.type === 'suggestion_approved' && (
                    <>
                      <CheckCircle className="inline h-3.5 w-3.5 text-emerald-500 ml-0.5 align-middle" /> پیشنهاد <span className="text-violet-600 dark:text-violet-400">{e.targetTitle || '—'}</span> تأیید شد
                    </>
                  )}
                  <span className="text-gray-400 text-xs mr-1"> · {new Date(e.createdAt).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </section>
      )}
    </div>
  );
}
