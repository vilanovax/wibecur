'use client';

import { Zap, Users, Activity, Shield } from 'lucide-react';

const PRIMARY = '#6366F1';

interface LiveStatusBarProps {
  saveVelocityPercent: number;
  activeUsers: number;
  interactions24h: number;
  lastSync: string;
  health?: 'stable' | 'warning' | 'critical';
}

export default function LiveStatusBar({
  saveVelocityPercent,
  activeUsers,
  interactions24h,
  lastSync,
  health = 'stable',
}: LiveStatusBarProps) {
  const syncTime = new Date(lastSync);
  const syncLabel = syncTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/40 dark:to-gray-900/80 p-4 shadow-sm"
      style={{ borderColor: `${PRIMARY}20` }}
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            آخرین همگام‌سازی: {syncLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Metric
            icon={Zap}
            label="سرعت ذخیره"
            value={`${saveVelocityPercent >= 0 ? '+' : ''}${saveVelocityPercent}%`}
            sub="۲۴h"
          />
          <Metric
            icon={Users}
            label="کاربران فعال"
            value={activeUsers.toLocaleString('fa-IR')}
          />
          <Metric
            icon={Activity}
            label="تعامل ۲۴h"
            value={interactions24h.toLocaleString('fa-IR')}
          />
          <div className="flex items-center gap-2 rounded-xl bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 shadow-sm">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              سلامت: {health === 'stable' ? 'پایدار' : health === 'warning' ? 'هشدار' : 'بحران'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center" style={{ color: PRIMARY }}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}{sub ? ` (${sub})` : ''}</p>
        <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
