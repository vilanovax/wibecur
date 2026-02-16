'use client';

import { Users, Bookmark, MessageSquare, List } from 'lucide-react';

type DayStat = { date: string; saves: number; comments: number; newUsers: number };

interface CardInput {
  label: string;
  value: number;
  changePercent: number | null;
  sparklineData: number[];
  color: 'green' | 'blue' | 'orange' | 'purple';
  icon: React.ComponentType<{ className?: string }>;
}

const colorMap = {
  green: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-200 dark:border-blue-500/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  orange: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-200 dark:border-amber-500/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  purple: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    border: 'border-violet-200 dark:border-violet-500/30',
    text: 'text-violet-700 dark:text-violet-400',
    icon: 'text-violet-600 dark:text-violet-400',
  },
};

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => `${(i / (data.length - 1 || 1)) * 100},${100 - (v / max) * 100}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full min-w-[60px] opacity-70">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Card({ label, value, changePercent, sparklineData, color, icon: Icon }: CardInput) {
  const c = colorMap[color];
  return (
    <div
      className={`rounded-2xl border ${c.border} ${c.bg} p-4 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${c.icon}`} />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${c.text}`}>
        {value.toLocaleString('fa-IR')}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        {changePercent !== null ? (
          <span
            className={`text-xs font-medium ${
              changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {changePercent >= 0 ? '+' : ''}{changePercent}% نسبت به دیروز
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
        <MiniSparkline data={sparklineData} />
      </div>
    </div>
  );
}

interface TodaySnapshotCardsProps {
  activeUsers: number;
  todaySaves: number;
  todayComments: number;
  todayLists: number;
  yesterdaySaves: number;
  yesterdayComments: number;
  newUsersYesterday: number;
  dailyStats: DayStat[];
}

export default function TodaySnapshotCards({
  activeUsers,
  todaySaves,
  todayComments,
  todayLists,
  yesterdaySaves,
  yesterdayComments,
  newUsersYesterday,
  dailyStats,
}: TodaySnapshotCardsProps) {
  const saveChange =
    yesterdaySaves === 0 ? (todaySaves > 0 ? 100 : 0) : Math.round(((todaySaves - yesterdaySaves) / yesterdaySaves) * 100);
  const commentChange =
    yesterdayComments === 0
      ? (todayComments > 0 ? 100 : 0)
      : Math.round(((todayComments - yesterdayComments) / yesterdayComments) * 100);
  const savesSpark = dailyStats.map((d) => d.saves);
  const commentsSpark = dailyStats.map((d) => d.comments);
  const usersSpark = dailyStats.map((d) => d.newUsers);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card
        label="کاربران فعال"
        value={activeUsers}
        changePercent={null}
        sparklineData={usersSpark}
        color="green"
        icon={Users}
      />
      <Card
        label="ذخیره‌ها"
        value={todaySaves}
        changePercent={saveChange}
        sparklineData={savesSpark}
        color="blue"
        icon={Bookmark}
      />
      <Card
        label="کامنت‌ها"
        value={todayComments}
        changePercent={commentChange}
        sparklineData={commentsSpark}
        color="orange"
        icon={MessageSquare}
      />
      <Card
        label="لیست‌های جدید"
        value={todayLists}
        changePercent={null}
        sparklineData={dailyStats.map(() => 0)}
        color="purple"
        icon={List}
      />
    </div>
  );
}
