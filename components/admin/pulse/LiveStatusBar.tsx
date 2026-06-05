'use client';

import { Users, Activity, Shield, Radio } from 'lucide-react';
import clsx from 'clsx';
import type { PulseHealth } from '@/lib/admin/pulse-utils';

interface LiveStatusBarProps {
  activeUsers: number;
  interactions24h: number;
  lastSync: string;
  health?: PulseHealth;
  connectionLabel?: string;
}

const healthConfig: Record<
  PulseHealth,
  { label: string; chip: string; dot: string }
> = {
  stable: {
    label: 'پایدار',
    chip: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  warning: {
    label: 'هشدار',
    chip: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/30',
    dot: 'bg-amber-500',
  },
  critical: {
    label: 'بحران',
    chip: 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-200 border-red-200 dark:border-red-500/30',
    dot: 'bg-red-500',
  },
};

export default function LiveStatusBar({
  activeUsers,
  interactions24h,
  lastSync,
  health = 'stable',
  connectionLabel = 'زنده',
}: LiveStatusBarProps) {
  const syncLabel = new Date(lastSync).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const hc = healthConfig[health];

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/80 px-3 py-1.5 text-xs shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <Radio className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-admin-text-secondary">
          {connectionLabel} · {syncLabel}
        </span>
      </div>

      <StatChip icon={Users} label="فعال" value={activeUsers.toLocaleString('fa-IR')} />
      <StatChip icon={Activity} label="تعامل" value={interactions24h.toLocaleString('fa-IR')} />

      <div
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
          hc.chip
        )}
      >
        <Shield className="h-3.5 w-3.5" />
        <span className={clsx('h-1.5 w-1.5 rounded-full', hc.dot)} aria-hidden />
        {hc.label}
      </div>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/80 px-3 py-1.5 text-xs shadow-sm">
      <Icon className="h-3.5 w-3.5 text-violet-500" />
      <span className="text-admin-text-tertiary">{label}</span>
      <span className="font-bold tabular-nums text-admin-text-primary">{value}</span>
    </div>
  );
}
