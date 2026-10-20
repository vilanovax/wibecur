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
  lastSync: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function PulsePageToolbar({
  activeTab,
  riskBadge,
  health,
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
        <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">
          <LiveStatusBar
            lastSync={lastSync}
            health={health}
            connectionLabel={activeTab === 'live' ? 'زنده' : 'داده'}
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={clsx(
              'inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-admin-border dark:border-gray-600',
              'bg-white px-3 text-sm font-medium text-admin-text-primary dark:bg-gray-800',
              'transition-colors hover:bg-admin-muted dark:hover:bg-gray-700',
              isRefreshing && 'cursor-wait opacity-60'
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
