'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Users,
  Bookmark,
  List,
  Lightbulb,
  TrendingUp,
  Flame,
  Award,
  AlertTriangle,
  Zap,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface GrowthData {
  pulseScore: number;
  pulseScoreWeeklyChange?: number;
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
  activation: {
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
    fastestCategory: {
      id: string;
      name: string;
      icon: string;
      slug: string;
      growth: number;
    } | null;
  };
  creatorSpotlight: {
    topListsBySave: {
      id: string;
      title: string;
      slug: string;
      saveCount: number;
      categories: { name: string; icon: string } | null;
    }[];
    topCreators: {
      userId: string;
      name: string | null;
      saves: number;
      lists: number;
    }[];
  };
  suggestionQualityRate: number;
  charts?: {
    activeUsersLast30Days: { date: string; count: number }[];
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
  trendingItems?: {
    id: string;
    title: string;
    imageUrl: string | null;
    velocity: number;
    saveCount: number;
  }[];
  fastestGrowingCategories?: {
    id: string;
    name: string;
    icon: string;
    slug: string;
    growth: number;
    savesThisWeek: number;
  }[];
  suggestionPanel?: {
    pendingCount: number;
    approvalRate: number;
    avgApprovalTimeHours: number;
  };
  creatorStats?: {
    listsWith50PlusSaves: number;
    pctUsersWith2PlusLists: number;
  };
  activityFeed?: {
    type: string;
    userId: string;
    userName: string | null;
    targetTitle: string | null;
    createdAt: string;
  }[];
}

const CARD_RADIUS = '20px';
const BRAND_GRADIENT = 'from-violet-600 via-purple-600 to-indigo-700';

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm shadow-gray-200/50 ${className}`}
    >
      {children}
    </div>
  );
}

function MiniSparkline({
  data,
  color = '#6366F1',
  id = 'mini',
}: {
  data: { value: number }[];
  color?: string;
  id?: string;
}) {
  if (!data?.length) return null;
  const gradId = `mini-grad-${id}-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data.map((d, i) => ({ ...d, index: i }))} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function GrowthKPIDashboard() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/kpi/growth')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setData(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={`h-40 rounded-[20px] bg-gradient-to-br ${BRAND_GRADIENT} animate-pulse`} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[20px] border border-gray-100 bg-white h-36 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[20px] border border-gray-100 bg-white h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-amber-800">خطا در بارگذاری داده‌های KPI</p>
      </div>
    );
  }

  const pulseColor =
    data.pulseScore >= 70 ? 'text-emerald-300' : data.pulseScore >= 40 ? 'text-amber-300' : 'text-red-300';
  const pulseBg =
    data.pulseScore >= 70 ? 'bg-emerald-500/20' : data.pulseScore >= 40 ? 'bg-amber-500/20' : 'bg-red-500/20';
  const weeklyChange = data.pulseScoreWeeklyChange ?? 0;

  return (
    <div className="flex flex-col xl:flex-row xl:gap-6">
      <div className="flex-1 min-w-0 space-y-6">
      {/* ——— 1️⃣ Hero: Pulse Overview ——— */}
      <section
        className={`rounded-[20px] bg-gradient-to-br ${BRAND_GRADIENT} p-6 md:p-8 text-white shadow-xl`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className={`flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-[20px] text-4xl font-black tabular-nums ${pulseBg} ${pulseColor}`}
            >
              {data.pulseScore}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-7 w-7 text-amber-300" />
                Pulse Score
              </h1>
              <p className="text-white/80 mt-1">
                {weeklyChange >= 0 ? (
                  <span className="flex items-center gap-1 text-emerald-200">
                    <TrendingUp className="h-4 w-4" />
                    +{weeklyChange} این هفته
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-200">
                    {weeklyChange} این هفته
                  </span>
                )}
              </p>
              {data.pulseScore < 40 && (
                <div className="flex items-center gap-2 mt-2 rounded-xl bg-red-500/20 px-3 py-1.5 text-red-100 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  زنگ خطر — زیر ۵۰
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 lg:max-w-2xl">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-white/70 text-xs mb-0.5">کاربران فعال امروز</p>
              <p className="text-2xl font-bold tabular-nums">
                {data.overview.activeUsersToday.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-white/70 text-xs mb-0.5">ذخیره امروز</p>
              <p className="text-2xl font-bold tabular-nums">
                {data.overview.savesToday.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-white/70 text-xs mb-0.5">لیست جدید امروز</p>
              <p className="text-2xl font-bold tabular-nums">
                {data.overview.newListsToday.toLocaleString('fa-IR')}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-white/70 text-xs mb-0.5">پیشنهادهای در انتظار بررسی</p>
              <p className="text-2xl font-bold tabular-nums">
                {data.overview.suggestionsPending.toLocaleString('fa-IR')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— 2️⃣ Engagement Overview: 4 KPI Cards ——— */}
      {data.kpiCards && data.kpiCards.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3 px-0.5">Engagement Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.kpiCards.map((card) => (
              <Card key={card.key}>
                <p className="text-xs font-medium text-gray-500 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
                <div className="mt-2 h-9">
                  <MiniSparkline
                    id={card.key}
                    data={card.series7d.map((s) => ({ value: s.value }))}
                    color={card.growthPercent >= 0 ? '#6366F1' : '#F59E0B'}
                  />
                </div>
                <p
                  className={`text-xs font-medium mt-1 ${
                    card.growthPercent >= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {card.growthPercent >= 0 ? '+' : ''}
                  {card.growthPercent}% نسبت به هفته قبل
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ——— 3️⃣ Growth Charts ——— */}
      {data.charts && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 px-0.5">Growth Charts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {data.charts.activeUsersLast30Days?.length > 0 && (
              <Card className="lg:col-span-2">
                <h3 className="text-sm font-medium text-gray-700 mb-3">کاربران فعال (۳۰ روز)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.charts.activeUsersLast30Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 10 }} width={28} />
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString('fa-IR'), 'کاربر']}
                      labelFormatter={(l) => l}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
            {data.charts.savesVsSuggestionsLast14?.length > 0 && (
              <Card>
                <h3 className="text-sm font-medium text-gray-700 mb-3">ذخیره vs پیشنهاد (۱۴ روز)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.charts.savesVsSuggestionsLast14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 10 }} width={28} />
                    <Tooltip />
                    <Line type="monotone" dataKey="saves" name="ذخیره" stroke="#6366F1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="suggestions" name="پیشنهاد" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
            {data.charts.newListsPerWeek?.length > 0 && (
              <Card className="lg:col-span-3">
                <h3 className="text-sm font-medium text-gray-700 mb-3">لیست‌های جدید هر هفته</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.charts.newListsPerWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} width={28} />
                    <Tooltip formatter={(value: number) => [value.toLocaleString('fa-IR'), 'لیست']} />
                    <Bar dataKey="count" name="لیست" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ——— 4️⃣ Trending + Suggestion Panel ——— */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 px-0.5 flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Trending Intelligence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-sm font-medium text-gray-700 mb-3">🔥 برترین آیتم‌ها</h3>
                {data.trendingItems && data.trendingItems.length > 0 ? (
                  <ul className="space-y-2">
                    {data.trendingItems.map((item, i) => (
                      <li key={item.id}>
                        <Link
                          href={`/items/${item.id}`}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400 text-lg font-bold">
                                {i + 1}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500">
                              Velocity: {item.velocity} · ذخیره لیست: {item.saveCount}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">داده‌ای نیست</p>
                )}
              </Card>
              <Card>
                <h3 className="text-sm font-medium text-gray-700 mb-3">📈 دسته‌های با رشد سریع</h3>
                {data.fastestGrowingCategories && data.fastestGrowingCategories.length > 0 ? (
                  <ul className="space-y-2">
                    {data.fastestGrowingCategories.map((cat) => (
                      <li
                        key={cat.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80"
                      >
                        <span className="text-xl ml-1">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{cat.name}</p>
                          <p className="text-xs text-gray-500">
                            {cat.savesThisWeek} ذخیره این هفته
                          </p>
                        </div>
                        <span className="text-emerald-600 font-bold text-sm">+{cat.growth}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">داده‌ای نیست</p>
                )}
              </Card>
            </div>
          </section>
        </div>
        <div>
          {/* ——— 5️⃣ Suggestion Control Panel ——— */}
          {data.suggestionPanel && (
            <Card className="h-full">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                پنل پیشنهادها
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">در انتظار بررسی</span>
                  <span className="font-bold text-gray-900">{data.suggestionPanel.pendingCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">نرخ تأیید</span>
                  <span className="font-bold text-emerald-600">{data.suggestionPanel.approvalRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    میانگین زمان تأیید
                  </span>
                  <span className="font-bold text-gray-900">
                    {data.suggestionPanel.avgApprovalTimeHours.toFixed(1)} ساعت
                  </span>
                </div>
              </div>
              <Link
                href="/admin/suggestions"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-100 text-violet-700 font-medium hover:bg-violet-200 transition-colors"
              >
                برو به مدیریت پیشنهادها
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* ——— 6️⃣ Retention + 7️⃣ Creator ——— */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Retention</h3>
          <div className="flex gap-6">
            <div className="flex-1 text-center p-3 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{data.retention.d1Retention}%</p>
              <p className="text-xs text-gray-500">D1</p>
              <p className="text-xs text-gray-400 mt-0.5">هدف &gt; 40%</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{data.retention.d7Retention}%</p>
              <p className="text-xs text-gray-500">D7</p>
              <p className="text-xs text-gray-400 mt-0.5">هدف &gt; 20%</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{data.retention.d30Retention ?? '-'}%</p>
              <p className="text-xs text-gray-500">D30</p>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Creator Economy
          </h3>
          {data.creatorStats ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">لیست با بیش از ۵۰ ذخیره</span>
                <span className="font-bold text-gray-900">{data.creatorStats.listsWith50PlusSaves}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">کاربران با ۲+ لیست</span>
                <span className="font-bold text-gray-900">{data.creatorStats.pctUsersWith2PlusLists}%</span>
              </div>
            </div>
          ) : null}
          <h4 className="text-xs font-medium text-gray-500 mt-3 mb-1">برترین سازندگان</h4>
          {data.creatorSpotlight.topCreators.length === 0 ? (
            <p className="text-sm text-gray-400">داده‌ای نیست</p>
          ) : (
            <ul className="space-y-1">
              {data.creatorSpotlight.topCreators.slice(0, 5).map((c) => (
                <li key={c.userId}>
                  <Link
                    href="/admin/users"
                    className="text-sm text-gray-800 hover:text-violet-600 font-medium"
                  >
                    {c.name || c.userId.slice(0, 8)}
                  </Link>
                  <span className="text-xs text-gray-500 mr-1">
                    {' '}
                    · {c.saves} ذخیره · {c.lists} لیست
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* نرخ کیفیت پیشنهاد (خلاصه) */}
      <Card className="flex flex-row items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">نرخ کیفیت پیشنهادها</h4>
          <p className="text-xs text-gray-500">تأیید شده / کل پیشنهادها</p>
        </div>
        <p className="text-3xl font-bold text-gray-900">{data.suggestionQualityRate}%</p>
      </Card>

      {/* فعالیت اخیر — فقط موبایل/تبلت (دسکتاپ در سایدبار راست) */}
      {data.activityFeed && data.activityFeed.length > 0 && (
        <div className="xl:hidden">
          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              فعالیت اخیر
            </h3>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {data.activityFeed.slice(0, 15).map((e, i) => (
                <li key={i} className="text-sm text-gray-600 py-1.5 border-b border-gray-100 last:border-0">
                  {e.type === 'save' && (
                    <>
                      <span className="font-medium text-gray-800">{e.userName || 'کاربر'}</span>
                      {' '}
                      لیست
                      {' '}
                      <span className="text-violet-600">{e.targetTitle || '—'}</span>
                      {' '}
                      را ذخیره کرد
                    </>
                  )}
                  {e.type === 'list_created' && (
                    <>
                      <span className="font-medium text-gray-800">{e.userName || 'کاربر'}</span>
                      {' '}
                      لیست
                      {' '}
                      <span className="text-violet-600">{e.targetTitle || '—'}</span>
                      {' '}
                      ساخت
                    </>
                  )}
                  {e.type === 'suggestion_approved' && (
                    <>
                      <CheckCircle className="inline h-3.5 w-3.5 text-emerald-500 ml-0.5 align-middle" />
                      {' '}
                      پیشنهاد
                      {' '}
                      <span className="text-violet-600">{e.targetTitle || '—'}</span>
                      {' '}
                      تأیید شد
                    </>
                  )}
                  <span className="text-gray-400 text-xs mr-1">
                    {' '}
                    · {new Date(e.createdAt).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
      </div>

      {/* ——— 8️⃣ Live Activity Feed — سمت راست دسکتاپ ——— */}
      {data.activityFeed && data.activityFeed.length > 0 && (
        <aside className="xl:w-80 flex-shrink-0 hidden xl:block">
          <div className="sticky top-4">
            <Card>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                فعالیت زنده
              </h3>
              <ul className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {data.activityFeed.slice(0, 30).map((e, i) => (
                  <li key={i} className="text-sm text-gray-600 py-1.5 border-b border-gray-100 last:border-0">
                    {e.type === 'save' && (
                      <>
                        <span className="font-medium text-gray-800">{e.userName || 'کاربر'}</span>
                        {' '}
                        آیتمی از لیست
                        {' '}
                        <span className="text-violet-600">{e.targetTitle || '—'}</span>
                        {' '}
                        را ذخیره کرد
                      </>
                    )}
                    {e.type === 'list_created' && (
                      <>
                        <span className="font-medium text-gray-800">{e.userName || 'کاربر'}</span>
                        {' '}
                        لیست جدید
                        {' '}
                        <span className="text-violet-600">{e.targetTitle || '—'}</span>
                        {' '}
                        ساخت
                      </>
                    )}
                    {e.type === 'suggestion_approved' && (
                      <>
                        <CheckCircle className="inline h-3.5 w-3.5 text-emerald-500 ml-0.5 align-middle" />
                        {' '}
                        پیشنهاد
                        {' '}
                        <span className="text-violet-600">{e.targetTitle || '—'}</span>
                        {' '}
                        تأیید شد
                      </>
                    )}
                    <span className="text-gray-400 text-xs block mt-0.5">
                      {new Date(e.createdAt).toLocaleDateString('fa-IR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </aside>
      )}
    </div>
  );
}
