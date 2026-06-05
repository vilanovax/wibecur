'use client';

import { Users, Bookmark, MessageSquare, List } from 'lucide-react';
import { dayOverDayTone, type DayStat } from '@/lib/admin/pulse-utils';

interface CardInput {
  label: string;
  value: number;
  footer: string;
  footerPositive?: boolean;
  footerMuted?: boolean;
  sparklineData: number[];
  color: 'green' | 'blue' | 'orange' | 'purple';
  icon: React.ComponentType<{ className?: string }>;
}

const colorMap = {
  green: {
    border: 'border-emerald-200/70 dark:border-emerald-500/25',
    bg: 'bg-emerald-50/50 dark:bg-emerald-500/5',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20',
    spark: '#10b981',
  },
  blue: {
    border: 'border-blue-200/70 dark:border-blue-500/25',
    bg: 'bg-blue-50/50 dark:bg-blue-500/5',
    text: 'text-blue-700 dark:text-blue-400',
    icon: 'text-blue-600 bg-blue-100 dark:bg-blue-500/20',
    spark: '#3b82f6',
  },
  orange: {
    border: 'border-amber-200/70 dark:border-amber-500/25',
    bg: 'bg-amber-50/50 dark:bg-amber-500/5',
    text: 'text-amber-700 dark:text-amber-400',
    icon: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20',
    spark: '#f59e0b',
  },
  purple: {
    border: 'border-violet-200/70 dark:border-violet-500/25',
    bg: 'bg-violet-50/50 dark:bg-violet-500/5',
    text: 'text-violet-700 dark:text-violet-400',
    icon: 'text-violet-600 bg-violet-100 dark:bg-violet-500/20',
    spark: '#8b5cf6',
  },
};

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return <div className="w-14 h-8" />;
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1 || 1)) * 56},${32 - (v / max) * 28}`)
    .join(' ');
  return (
    <svg viewBox="0 0 56 32" className="w-14 h-8 shrink-0 opacity-80">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
}

function Card({
  label,
  value,
  footer,
  footerPositive,
  footerMuted,
  sparklineData,
  color,
  icon: Icon,
}: CardInput) {
  const c = colorMap[color];
  const footerClass = footerPositive
    ? 'text-emerald-600'
    : footerMuted
      ? 'text-admin-text-tertiary'
      : 'text-admin-text-secondary';

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border ${c.border} ${c.bg} px-2.5 py-2 shadow-sm min-w-0`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.icon}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-admin-text-tertiary leading-none mb-0.5">{label}</p>
        <p className={`text-xl font-bold tabular-nums leading-tight ${c.text}`}>
          {value.toLocaleString('fa-IR')}
        </p>
        <p className={`text-[10px] leading-tight truncate mt-0.5 ${footerClass}`}>{footer}</p>
      </div>
      <MiniSpark data={sparklineData} color={c.spark} />
    </div>
  );
}

interface TodaySnapshotCardsProps {
  activeUsers: number;
  newUsersToday: number;
  todaySaves: number;
  todayComments: number;
  todayLists: number;
  yesterdaySaves: number;
  yesterdayComments: number;
  yesterdayLists: number;
  dailyStats: DayStat[];
}

export default function TodaySnapshotCards(props: TodaySnapshotCardsProps) {
  const {
    activeUsers,
    newUsersToday,
    todaySaves,
    todayComments,
    todayLists,
    yesterdaySaves,
    yesterdayComments,
    yesterdayLists,
    dailyStats,
  } = props;

  const saveFooter = dayOverDayTone(todaySaves, yesterdaySaves);
  const commentFooter = dayOverDayTone(todayComments, yesterdayComments);
  const listsFooter = dayOverDayTone(todayLists, yesterdayLists);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
      <Card
        label="کاربران فعال"
        value={activeUsers}
        footer={`ثبت‌نام: ${newUsersToday.toLocaleString('fa-IR')}`}
        sparklineData={dailyStats.map((d) => d.newUsers)}
        color="green"
        icon={Users}
      />
      <Card
        label="ذخیره"
        value={todaySaves}
        footer={saveFooter.text}
        footerPositive={saveFooter.positive}
        footerMuted={saveFooter.muted}
        sparklineData={dailyStats.map((d) => d.saves)}
        color="blue"
        icon={Bookmark}
      />
      <Card
        label="کامنت"
        value={todayComments}
        footer={commentFooter.text}
        footerPositive={commentFooter.positive}
        footerMuted={commentFooter.muted}
        sparklineData={dailyStats.map((d) => d.comments)}
        color="orange"
        icon={MessageSquare}
      />
      <Card
        label="لیست جدید"
        value={todayLists}
        footer={listsFooter.text}
        footerPositive={listsFooter.positive}
        footerMuted={listsFooter.muted}
        sparklineData={dailyStats.map((d) => d.lists ?? 0)}
        color="purple"
        icon={List}
      />
    </div>
  );
}
