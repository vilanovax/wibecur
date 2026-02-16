'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Flame, Tag, MapPin, Lightbulb, Clock } from 'lucide-react';
import AdminLiveFeed from '@/components/admin/pulse/AdminLiveFeed';
import LiveStatusBar from '@/components/admin/pulse/LiveStatusBar';
import TodaySnapshotCards from '@/components/admin/pulse/TodaySnapshotCards';
import type { TrendingItem } from '@/types/items';

interface OverviewData {
  todaySaves: number;
  todayComments: number;
  activeUsersToday: number;
  newUsersToday: number;
  todayInteractions: number;
  todayLists?: number;
  yesterdaySaves?: number;
  yesterdayComments?: number;
  newUsersYesterday?: number;
  dailyStats: { date: string; saves: number; comments: number; newUsers: number }[];
  risk?: { reportsPending: number; suspiciousLists: number; saveSpikes: number };
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

interface SuggestionHealth {
  pendingTotal: number;
  approvedToday: number;
  rejectedToday: number;
  pendingItems: number;
  pendingLists: number;
}

interface PulseData {
  overview: OverviewData | null;
  trending: TrendingItem[];
  trendingLists: TrendingListRow[];
  categories: CategoryGrowth[];
  cities: unknown[];
  suggestions: SuggestionHealth | null;
}

async function fetchPulseData(): Promise<PulseData> {
  const [o, t, tl, c, cit, s] = await Promise.all([
    fetch('/api/admin/pulse/overview').then((r) => r.json()),
    fetch('/api/admin/pulse/trending').then((r) => r.json()),
    fetch('/api/admin/pulse/trending-lists').then((r) => r.json()),
    fetch('/api/admin/pulse/categories').then((r) => r.json()),
    fetch('/api/admin/pulse/cities').then((r) => r.json()),
    fetch('/api/admin/pulse/suggestions').then((r) => r.json()),
  ]);
  return {
    overview: o.data ?? null,
    trending: t.data ?? [],
    trendingLists: tl.data ?? [],
    categories: c.data ?? [],
    cities: cit.data ?? [],
    suggestions: s.data ?? null,
  };
}

export default function PulseDashboardClient() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin', 'pulse'],
    queryFn: fetchPulseData,
    staleTime: 60 * 1000,
  });
  const overview = data?.overview ?? null;
  const trending = data?.trending ?? [];
  const trendingLists = data?.trendingLists ?? [];
  const categories = data?.categories ?? [];
  const cities = data?.cities ?? [];
  const suggestions = data?.suggestions ?? null;

  const saveVelocityPercent =
    overview?.yesterdaySaves != null && overview.yesterdaySaves > 0 && overview?.todaySaves != null
      ? Math.round(((overview.todaySaves - overview.yesterdaySaves) / overview.yesterdaySaves) * 100)
      : overview?.todaySaves
        ? 100
        : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-gray-100 dark:bg-gray-800/50 h-20 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-gray-100 dark:bg-gray-800/50 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1 — Live Status Bar */}
      <section>
        <LiveStatusBar
          saveVelocityPercent={saveVelocityPercent}
          activeUsers={overview?.activeUsersToday ?? 0}
          interactions24h={overview?.todayInteractions ?? 0}
          lastSync={overview?.lastSync ?? new Date().toISOString()}
          health="stable"
        />
      </section>

      {/* Section 2 — Today Snapshot (4 semantic cards) */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
          <ActivityIcon />
          فعالیت امروز
        </h2>
        <TodaySnapshotCards
          activeUsers={overview?.activeUsersToday ?? 0}
          todaySaves={overview?.todaySaves ?? 0}
          todayComments={overview?.todayComments ?? 0}
          todayLists={overview?.todayLists ?? 0}
          yesterdaySaves={overview?.yesterdaySaves ?? 0}
          yesterdayComments={overview?.yesterdayComments ?? 0}
          newUsersYesterday={overview?.newUsersYesterday ?? 0}
          dailyStats={overview?.dailyStats ?? []}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5" />
          مجموع تعامل امروز: {(overview?.todayInteractions ?? 0).toLocaleString('fa-IR')}
        </p>
      </section>

      {/* Live Activity Feed */}
      <AdminLiveFeed />

      {/* Section 4 — 7-Day Trend */}
      {overview?.dailyStats && overview.dailyStats.length > 0 && (
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            روند ۷ روز اخیر (ذخیره)
          </h2>
          <SevenDayLineChart data={overview.dailyStats.map((d) => d.saves)} labels={overview.dailyStats.map((d) => d.date.slice(5))} />
        </section>
      )}

      {/* Section 5 — Trending Now (Lists) */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          الان وایب روی ایناست
        </h2>
        {trendingLists.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">داده‌ای نیست</p>
        ) : (
          <div className="space-y-2">
            {trendingLists.map((t) => (
              <Link
                key={t.listId}
                href={`/lists/${t.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/30 text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  {t.rank}
                </span>
                <span className="flex-1 truncate text-gray-800 dark:text-gray-200 font-medium">{t.title}</span>
                <span className="text-xs text-gray-500 tabular-nums">امتیاز {t.score.toLocaleString('fa-IR')}</span>
                {t.categorySlug && (
                  <span className="rounded-md bg-gray-200 dark:bg-gray-600 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                    {t.categorySlug}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Section 6 — Category Momentum */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-500" />
          مومنتوم دسته‌ها
        </h2>
        {categories.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">داده‌ای نیست</p>
        ) : (
          <div className="space-y-3">
            {categories.slice(0, 8).map((cat) => (
              <div key={cat.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-200">{cat.name}</span>
                  <span className="text-gray-500">
                    رشد {cat.growthPercent >= 0 ? '+' : ''}{cat.growthPercent}% · {cat.activeListsCount ?? 0} لیست
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, cat.growthPercent + 50))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 7 — Risk Snapshot */}
      {(overview?.risk?.reportsPending !== undefined || overview?.risk?.suspiciousLists !== undefined || overview?.risk?.saveSpikes !== undefined) && (
        <section className="rounded-2xl border border-amber-200 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/10 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">وضعیت ریسک و Moderation</h2>
          <div className="flex flex-wrap gap-4">
            <RiskItem
              label="لیست‌های مشکوک"
              value={overview?.risk?.suspiciousLists ?? 0}
              severity={overview?.risk?.suspiciousLists ? 'warning' : 'neutral'}
            />
            <RiskItem
              label="اسپایک ذخیره"
              value={overview?.risk?.saveSpikes ?? 0}
              severity={overview?.risk?.saveSpikes ? 'danger' : 'neutral'}
            />
            <RiskItem
              label="ریپورت در انتظار"
              value={overview?.risk?.reportsPending ?? 0}
              severity={overview?.risk?.reportsPending ? 'danger' : 'neutral'}
            />
          </div>
        </section>
      )}

      {/* City Pulse - placeholder */}
      {cities.length > 0 ? (
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            پالس شهرها
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">در حال توسعه</p>
        </section>
      ) : null}

      {/* Suggestion Health */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          سلامت پیشنهادها
        </h2>
        {suggestions ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{suggestions.pendingTotal}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">در انتظار</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{suggestions.approvedToday}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">تأیید امروز</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-500/10 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{suggestions.rejectedToday}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">رد امروز</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">داده‌ای نیست</p>
        )}
        <Link
          href="/admin/suggestions"
          className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <Clock className="w-4 h-4" />
          مدیریت پیشنهادها
        </Link>
      </section>
    </div>
  );
}

function ActivityIcon() {
  return (
    <span className="w-4 h-4 rounded-full bg-amber-500/50 flex items-center justify-center">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
    </span>
  );
}

function SevenDayLineChart({ data, labels }: { data: number[]; labels: string[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const w = 400;
  const h = 120;
  const pad = 24;
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="pulse-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#pulse-line-fill)" />
        <polyline
          fill="none"
          stroke="#6366F1"
          strokeWidth="2"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function RiskItem({
  label,
  value,
  severity,
}: {
  label: string;
  value: number;
  severity: 'neutral' | 'warning' | 'danger';
}) {
  const style =
    severity === 'danger'
      ? 'text-red-700 dark:text-red-300 font-semibold'
      : severity === 'warning'
        ? 'text-amber-700 dark:text-amber-300 font-medium'
        : 'text-gray-600 dark:text-gray-400';
  return (
    <div className="flex items-center gap-2">
      <span className={style}>{label}:</span>
      <span className={`tabular-nums font-bold ${style}`}>{value.toLocaleString('fa-IR')}</span>
    </div>
  );
}
