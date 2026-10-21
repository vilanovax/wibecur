'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
import { fa, faNumber } from '@/lib/utils';
import { formatJalali } from '@/lib/jalali';

const GrowthCharts = dynamic(() => import('./GrowthCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-hidden>
      <div className="h-72 animate-pulse rounded-xl bg-admin-muted" />
      <div className="h-72 animate-pulse rounded-xl bg-admin-muted" />
    </div>
  ),
});

type Severity = 'positive' | 'neutral' | 'negative';

function getSeverity(growthPercent: number | undefined): Severity {
  if (growthPercent == null) return 'neutral';
  if (growthPercent > 0) return 'positive';
  if (growthPercent < 0) return 'negative';
  return 'neutral';
}

const SEVERITY_TEXT: Record<Severity, string> = {
  positive: 'text-green-700 dark:text-green-400',
  neutral: 'text-admin-text-tertiary dark:text-[var(--color-text-muted)]',
  negative: 'text-red-700 dark:text-red-400',
};

function faPct(value: number) {
  return `${fa(value)}٪`;
}

function faDecimal(value: number) {
  return fa(value).replace('.', '٫');
}

function faDurationHours(hours: number) {
  if (hours <= 0) return '۰ دقیقه';
  if (hours >= 48) return `${faDecimal(Math.round((hours / 24) * 10) / 10)} روز`;
  if (hours >= 1) return `${faDecimal(Math.round(hours * 10) / 10)} ساعت`;
  return `${fa(Math.max(1, Math.round(hours * 60)))} دقیقه`;
}

function activityWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const time = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tehran',
  }).format(date);
  return `${formatJalali(date, { year: false })}، ${time}`;
}

function KpiCard({
  label,
  value,
  growthPercent,
  href,
}: {
  label: string;
  value: React.ReactNode;
  growthPercent?: number;
  href?: string;
}) {
  const severity = getSeverity(growthPercent);
  const body = (
    <>
      <p className="text-xs font-medium text-admin-text-tertiary dark:text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-2xl font-bold text-admin-text-primary dark:text-white tabular-nums">{value}</p>
      {growthPercent != null && (
        <p className={`text-xs mt-1.5 font-medium ${SEVERITY_TEXT[severity]}`}>
          {growthPercent >= 0 ? '+' : ''}
          {faPct(growthPercent)} نسبت به هفته قبل
        </p>
      )}
    </>
  );
  const className =
    'rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-admin-border dark:border-gray-600 p-4 min-h-24';
  if (href) {
    return (
      <Link href={href} className={`${className} block hover:bg-admin-muted/60 transition-colors`}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

function SystemHealthBanner({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const config = {
    healthy: {
      icon: ShieldCheck,
      label: 'سالم',
      className: 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300',
    },
    warning: {
      icon: ShieldAlert,
      label: 'هشدار',
      className: 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200',
    },
    critical: {
      icon: ShieldX,
      label: 'بحرانی',
      className: 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300',
    },
  };
  const { icon: Icon, label, className } = config[status];
  return (
    <div className={`rounded-xl px-6 py-4 flex items-center justify-between border ${className}`}>
      <span className="flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5" strokeWidth={2} />
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
  const decliningRatio = kpiCards.length > 0 ? negativeCount / kpiCards.length : 0;
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
  activation?: {
    pctFirstSaveIn24h: number;
    newUsersLast7: number;
    newUsersWithFirstSave: number;
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
    const ctrl = new AbortController();
    fetch('/api/admin/kpi/growth', { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setData(json.data);
      })
      .catch((e) => {
        if ((e as Error)?.name !== 'AbortError') console.error(e);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  const categoriesWithBadge = useMemo(() => {
    const list = data?.fastestGrowingCategories ?? [];
    return list.map((cat) => ({
      ...cat,
      status: (cat.growth >= 30 ? 'fast' : cat.growth >= 10 ? 'stable' : 'low') as 'fast' | 'stable' | 'low',
    }));
  }, [data?.fastestGrowingCategories]);

  if (loading) {
    return (
      <div className="space-y-8 py-2" dir="rtl">
        <div className="h-16 rounded-xl border border-admin-border dark:border-gray-600 bg-admin-muted dark:bg-gray-800 animate-pulse" />
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
        <p className="text-amber-800 dark:text-amber-200">داده‌های رشد بارگذاری نشد. صفحه را یک‌بار تازه کنید.</p>
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
  const topCreator = data.creatorSpotlight.topCreators[0];
  const listsWith50Saves = data.creatorStats?.listsWith50PlusSaves ?? 0;
  const pctTwoLists = data.creatorStats?.pctUsersWith2PlusLists ?? 0;
  const approvalRate = data.suggestionApprovalRate ?? data.suggestionPanel?.approvalRate ?? data.suggestionQualityRate ?? 0;
  const approvalHours = data.suggestionPanel?.avgApprovalTimeHours ?? 0;
  const activationPct = data.activation?.pctFirstSaveIn24h ?? 0;
  const topLists = data.topMovers.topListsWeek ?? [];
  const topItems = data.topMovers.topItemsByVotes ?? [];

  return (
    <div className="space-y-8 py-2" dir="rtl">
      <section>
        <SystemHealthBanner status={systemHealth} />
      </section>

      <section className="rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-14 flex-shrink-0 items-baseline justify-center whitespace-nowrap rounded-xl bg-admin-muted px-3 text-2xl font-bold tabular-nums text-admin-text-primary dark:bg-gray-700 dark:text-white">
              {faDecimal(pulseOutOf10)}
              <span className="ms-1 text-sm font-normal text-admin-text-tertiary">از ۱۰</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold flex items-center gap-2 text-admin-text-primary dark:text-white">
                <Zap className="h-4 w-4 text-amber-600" strokeWidth={2} />
                نبض رشد
              </h2>
              <p className="text-sm text-admin-text-secondary mt-0.5">
                {weeklyChange !== 0 && (
                  <span className={weeklyChange > 0 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                    {weeklyChange > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 inline" strokeWidth={2} />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 inline" strokeWidth={2} />
                    )}{' '}
                    {weeklyChange > 0 ? '+' : ''}
                    {faDecimal(Math.round((weeklyChange / 10) * 10) / 10)} نسبت به هفته قبل
                  </span>
                )}
                <span> · {statusLabel}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-w-0 md:max-w-md">
            {[
              { label: 'تعامل', value: breakdown.engagement },
              { label: 'بازگشت', value: breakdown.retention },
              { label: 'رشد محتوا', value: breakdown.contentGrowth },
              { label: 'سازنده', value: breakdown.creatorActivity },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-admin-muted dark:bg-gray-700/40 py-2 px-2 text-center">
                <p className="text-xs text-admin-text-tertiary">{label}</p>
                <p className="text-sm font-semibold tabular-nums text-admin-text-primary dark:text-white">{faDecimal(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white">امروز</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="کاربران فعال امروز" value={faNumber(data.overview.activeUsersToday)} />
          <KpiCard label="ذخیره امروز" value={faNumber(data.overview.savesToday)} />
          <KpiCard label="لیست جدید امروز" value={faNumber(data.overview.newListsToday)} />
          <KpiCard
            label="پیشنهاد در انتظار"
            value={faNumber(pendingSuggestions)}
            href="/admin/suggestions"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white">هفت روز گذشته</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="کاربران فعال"
            value={faNumber(data.activeUsers7d ?? 0)}
            growthPercent={activeUsersPctCard?.growthPercent}
          />
          <KpiCard label="لیست جدید" value={faNumber(data.newLists7d ?? 0)} />
          <KpiCard
            label="ذخیره به ازای کاربر"
            value={savesPerUserCard ? faDecimal(savesPerUserCard.value) : '—'}
            growthPercent={savesPerUserCard?.growthPercent}
          />
          <KpiCard
            label="نرخ کامنت"
            value={commentRateCard ? faPct(commentRateCard.value) : '—'}
            growthPercent={commentRateCard?.growthPercent}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="نرخ تأیید پیشنهاد" value={faPct(approvalRate)} />
          <KpiCard label="میانگین زمان تأیید" value={faDurationHours(approvalHours)} />
          <KpiCard
            label="فعال‌سازی روز اول"
            value={faPct(activationPct)}
          />
          <KpiCard label="ذخیره این هفته" value={faNumber(data.engagementDetail.savesWeek)} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white">بازگشت کاربران</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="روز بعد" value={faPct(data.retention.d1Retention)} />
          <KpiCard label="هفت روز" value={faPct(data.retention.d7Retention)} />
          <KpiCard label="سی روز" value={faPct(data.retention.d30Retention ?? 0)} />
        </div>
        <p className="text-xs text-admin-text-tertiary">
          سهم کاربرانی که بعد از ثبت‌نام دوباره لیستی ذخیره کرده‌اند. صفر یعنی در آن بازه کسی برنگشته.
        </p>
      </section>

      {pendingSuggestions > 0 && (
        <section>
          <Link
            href="/admin/suggestions"
            className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-6 py-4 flex items-center justify-between min-h-14"
          >
            <span className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-semibold">
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
              پیشنهادهای در انتظار بررسی
            </span>
            <span className="text-lg font-bold text-amber-800 dark:text-amber-200 tabular-nums">{faNumber(pendingSuggestions)}</span>
          </Link>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white">دسته‌ها</h2>
        {categoriesWithBadge.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesWithBadge.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl bg-white dark:bg-gray-800 border border-admin-border dark:border-gray-600 p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-lg" aria-hidden>{cat.icon}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      cat.status === 'fast'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : cat.status === 'stable'
                          ? 'bg-gray-100 text-[var(--color-text)] dark:bg-gray-700 dark:text-gray-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                    }`}
                  >
                    {cat.status === 'fast' && (
                      <>
                        <Flame className="h-3 w-3" strokeWidth={2} /> رشد سریع
                      </>
                    )}
                    {cat.status === 'stable' && 'پایدار'}
                    {cat.status === 'low' && (
                      <>
                        <AlertTriangle className="h-3 w-3" strokeWidth={2} /> تعامل پایین
                      </>
                    )}
                  </span>
                </div>
                <p className="font-medium text-admin-text-primary dark:text-white truncate">{cat.name}</p>
                <p className="text-xs text-admin-text-tertiary dark:text-[var(--color-text-subtle)] mt-1">
                  +{faPct(cat.growth)} رشد · {faNumber(cat.savesThisWeek ?? 0)} ذخیره این هفته
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-admin-border dark:border-gray-600 bg-admin-muted dark:bg-gray-800/50 p-6 text-center text-admin-text-tertiary text-sm">
            این هفته ذخیره‌ای روی دسته‌ها ثبت نشده.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white flex items-center gap-2">
          <Flame className="h-4 w-4" strokeWidth={2} />
          برترین‌های هفته
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-admin-border dark:border-gray-600 overflow-hidden">
            <div className="px-4 py-3 border-b border-admin-border dark:border-gray-600 bg-admin-muted/50 dark:bg-gray-700/30">
              <h3 className="text-sm font-medium text-admin-text-primary dark:text-white">لیست‌های ذخیره‌شده</h3>
            </div>
            {topLists.length > 0 ? (
              <ul className="divide-y divide-admin-border dark:divide-gray-600">
                {topLists.slice(0, 8).map((list, i) => (
                  <li key={list.id}>
                    <Link
                      href={`/lists/${list.slug}`}
                      className="flex items-center gap-3 py-3 px-4 min-h-12 hover:bg-admin-muted/50 dark:hover:bg-gray-700/30"
                    >
                      <span className="text-admin-text-tertiary text-xs font-medium w-6 tabular-nums">{fa(i + 1)}</span>
                      <span className="font-medium text-admin-text-primary dark:text-white truncate flex-1 min-w-0">{list.title}</span>
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded tabular-nums">
                        {faNumber(list.saves)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-admin-text-tertiary py-6 px-4">این هفته لیستی ذخیره نشده.</p>
            )}
          </div>
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-admin-border dark:border-gray-600 overflow-hidden">
            <div className="px-4 py-3 border-b border-admin-border dark:border-gray-600 bg-admin-muted/50 dark:bg-gray-700/30">
              <h3 className="text-sm font-medium text-admin-text-primary dark:text-white">آیتم‌های پررأی</h3>
            </div>
            {topItems.length > 0 ? (
              <ul className="divide-y divide-admin-border dark:divide-gray-600">
                {topItems.slice(0, 8).map((item, i) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 px-4 min-h-12">
                    <span className="text-admin-text-tertiary text-xs font-medium w-6 tabular-nums">{fa(i + 1)}</span>
                    <span className="font-medium text-admin-text-primary dark:text-white truncate flex-1 min-w-0">{item.title}</span>
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded tabular-nums">
                      {faNumber(item.votes)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-admin-text-tertiary py-6 px-4">این هفته رأیی ثبت نشده.</p>
            )}
          </div>
        </div>
      </section>

      {data.charts && (data.charts.activeUsersLast30Days?.length ?? 0) > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white">روند سی روز</h2>
          <GrowthCharts
            activeUsers={data.charts.activeUsersLast30Days}
            savesVsLists={data.charts.savesVsListsLast30Days ?? []}
          />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-admin-text-primary dark:text-white flex items-center gap-2">
          <Award className="h-4 w-4" strokeWidth={2} />
          سازندگان
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="لیست با بیش از ۵۰ ذخیره" value={faNumber(listsWith50Saves)} />
          <KpiCard label="کاربران با حداقل دو لیست" value={faPct(pctTwoLists)} />
          <KpiCard
            label="فعال‌ترین سازنده"
            value={topCreator ? topCreator.name || 'بدون نام' : '—'}
          />
        </div>
      </section>

      {data.activityFeed && data.activityFeed.length > 0 && (
        <section>
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-admin-border dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setActivityOpen(!activityOpen)}
              className="flex items-center justify-between w-full min-h-12 px-4 py-3 text-sm font-semibold text-admin-text-primary dark:text-white hover:bg-admin-muted/50 dark:hover:bg-gray-700/30"
            >
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" strokeWidth={2} />
                نمایش فعالیت‌ها
              </span>
              {activityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div className={`transition-all duration-200 overflow-hidden ${activityOpen ? 'max-h-96' : 'max-h-0'}`}>
              <ul className="border-t border-admin-border dark:border-gray-600 p-4 space-y-2 overflow-y-auto">
                {data.activityFeed.slice(0, 15).map((e, i) => (
                  <li key={`${e.type}-${e.createdAt}-${i}`} className="text-sm text-admin-text-secondary py-1">
                    {e.type === 'save' && (
                      <>
                        <span className="font-medium text-admin-text-primary dark:text-white">{e.userName || 'کاربر'}</span> لیست{' '}
                        <span className="text-indigo-700 dark:text-indigo-300">{e.targetTitle || '—'}</span> را ذخیره کرد
                      </>
                    )}
                    {e.type === 'list_created' && (
                      <>
                        <span className="font-medium text-admin-text-primary dark:text-white">{e.userName || 'کاربر'}</span> لیست{' '}
                        <span className="text-indigo-700 dark:text-indigo-300">{e.targetTitle || '—'}</span> ساخت
                      </>
                    )}
                    {e.type === 'suggestion_approved' && (
                      <>
                        <CheckCircle className="inline h-3.5 w-3.5 text-emerald-600 me-1 align-middle" strokeWidth={2} />
                        پیشنهاد <span className="text-indigo-700 dark:text-indigo-300">{e.targetTitle || '—'}</span> تأیید شد
                      </>
                    )}
                    <span className="text-admin-text-tertiary text-xs ms-1"> · {activityWhen(e.createdAt)}</span>
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
