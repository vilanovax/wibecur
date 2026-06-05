'use client';

import { Activity, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import PulseTabs from './PulseTabs';
import LiveStatusBar from './LiveStatusBar';
import type { PulseTab } from '@/lib/admin/pulse-types';
import type { PulseHealth } from '@/lib/admin/pulse-utils';

interface PulsePageToolbarProps {
  activeTab: PulseTab;
  riskBadge: number;
  health: PulseHealth;
  activeUsers: number;
  interactions24h: number;
  lastSync: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function PulsePageToolbar({
  activeTab,
  riskBadge,
  health,
  activeUsers,
  interactions24h,
  lastSync,
  onRefresh,
  isRefreshing,
}: PulsePageToolbarProps) {
  return (
    <div className="flex flex-col gap-2" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-5 w-5 shrink-0 text-violet-600" />
          <h1 className="text-lg font-bold text-admin-text-primary truncate">پالس وایب</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <LiveStatusBar
            activeUsers={activeUsers}
            interactions24h={interactions24h}
            lastSync={lastSync}
            health={health}
            connectionLabel={activeTab === 'live' ? 'زنده' : 'داده'}
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg border border-admin-border dark:border-gray-600',
              'bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-admin-text-primary',
              'hover:bg-admin-muted dark:hover:bg-gray-700 transition-colors',
              isRefreshing && 'opacity-60 cursor-wait'
            )}
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            بروزرسانی
          </button>
        </div>
      </div>
      <PulseTabs active={activeTab} riskBadge={riskBadge} />
    </div>
  );
}
