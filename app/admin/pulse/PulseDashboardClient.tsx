'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  MessageSquare,
  Users,
  UserPlus,
  TrendingUp,
  Flame,
  Tag,
  MapPin,
  Lightbulb,
  Clock,
} from 'lucide-react';
import AdminLiveFeed from '@/components/admin/pulse/AdminLiveFeed';
import type { TrendingItem } from '@/types/items';

interface OverviewData {
  todaySaves: number;
  todayComments: number;
  activeUsersToday: number;
  newUsersToday: number;
  todayInteractions: number;
  dailyStats: { date: string; saves: number; comments: number; newUsers: number }[];
}

interface CategoryGrowth {
  id: string;
  name: string;
  icon: string;
  slug: string;
  growthPercent: number;
}

interface SuggestionHealth {
  pendingTotal: number;
  approvedToday: number;
  rejectedToday: number;
  pendingItems: number;
  pendingLists: number;
}

export default function PulseDashboardClient() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [categories, setCategories] = useState<CategoryGrowth[]>([]);
  const [cities, setCities] = useState<unknown[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [o, t, c, cit, s] = await Promise.all([
          fetch('/api/admin/pulse/overview').then((r) => r.json()),
          fetch('/api/admin/pulse/trending').then((r) => r.json()),
          fetch('/api/admin/pulse/categories').then((r) => r.json()),
          fetch('/api/admin/pulse/cities').then((r) => r.json()),
          fetch('/api/admin/pulse/suggestions').then((r) => r.json()),
        ]);
        if (o.data) setOverview(o.data);
        if (t.data) setTrending(t.data);
        if (c.data) setCategories(c.data);
        if (cit.data) setCities(cit.data);
        if (s.data) setSuggestions(s.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-gray-800/50 h-24 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <ActivityIcon />
          فعالیت امروز
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Bookmark}
            label="ذخیره‌ها"
            value={overview?.todaySaves ?? 0}
          />
          <MetricCard
            icon={MessageSquare}
            label="کامنت‌ها"
            value={overview?.todayComments ?? 0}
          />
          <MetricCard
            icon={Users}
            label="کاربران فعال"
            value={overview?.activeUsersToday ?? 0}
          />
          <MetricCard
            icon={UserPlus}
            label="کاربر جدید"
            value={overview?.newUsersToday ?? 0}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          🔥 مجموع تعامل امروز: {overview?.todayInteractions ?? 0}
        </p>
      </section>

      {/* Live Activity Feed */}
      <AdminLiveFeed />

      {/* Growth Chart */}
      {overview?.dailyStats && overview.dailyStats.length > 0 && (
        <section className="rounded-xl bg-gray-800/40 border border-gray-700/50 p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            روند ۷ روز اخیر
          </h2>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-2">
              {overview.dailyStats.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-1 w-16"
                >
                  <div
                    className="w-full bg-orange-500/30 rounded-t flex flex-col justify-end"
                    style={{ height: 120 }}
                  >
                    <div
                      className="bg-orange-500 rounded-t w-full"
                      style={{
                        height: `${Math.min(100, (day.saves / Math.max(1, Math.max(...overview.dailyStats.map((d) => d.saves)))) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {day.date.slice(5)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ذخیره {day.saves}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Now */}
      <section className="rounded-xl bg-gray-800/40 border border-gray-700/50 p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          الان وایب روی ایناست
        </h2>
        {trending.length === 0 ? (
          <p className="text-gray-500 text-sm">داده‌ای نیست</p>
        ) : (
          <div className="space-y-2">
            {trending.map((t, i) => (
              <Link
                key={t.id}
                href={`/items/${t.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30 transition-colors"
              >
                <span className="text-gray-500 w-6">#{i + 1}</span>
                <span className="flex-1 truncate text-gray-200">{t.title}</span>
                <span className="text-xs text-gray-500">
                  ⭐ {t.rating ?? '-'} · 👥 {t.saveCount}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Hot Categories */}
      <section className="rounded-xl bg-gray-800/40 border border-gray-700/50 p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          دسته‌های داغ (نسبت به هفته قبل)
        </h2>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm">داده‌ای نیست</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 8).map((cat) => (
              <span
                key={cat.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                  cat.growthPercent >= 0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span>
                  {cat.growthPercent >= 0 ? '+' : ''}
                  {cat.growthPercent}%
                </span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* City Pulse - placeholder */}
      {cities.length > 0 ? (
        <section className="rounded-xl bg-gray-800/40 border border-gray-700/50 p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            پالس شهرها
          </h2>
          <p className="text-gray-500 text-sm">در حال توسعه</p>
        </section>
      ) : null}

      {/* Suggestion Health */}
      <section className="rounded-xl bg-gray-800/40 border border-gray-700/50 p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          سلامت پیشنهادها
        </h2>
        {suggestions ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-2xl font-bold text-amber-400">
                {suggestions.pendingTotal}
              </p>
              <p className="text-xs text-gray-400">در انتظار</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-2xl font-bold text-emerald-400">
                {suggestions.approvedToday}
              </p>
              <p className="text-xs text-gray-400">تأیید امروز</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-2xl font-bold text-red-400">
                {suggestions.rejectedToday}
              </p>
              <p className="text-xs text-gray-400">رد امروز</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">داده‌ای نیست</p>
        )}
        <Link
          href="/admin/suggestions"
          className="inline-flex items-center gap-1 mt-3 text-sm text-orange-400 hover:text-orange-300"
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
    <span className="w-4 h-4 rounded-full bg-orange-500/50 flex items-center justify-center">
      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">
        {value.toLocaleString('fa-IR')}
      </p>
    </div>
  );
}
