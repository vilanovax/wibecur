'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { PULSE_TABS, type PulseTab } from '@/lib/admin/pulse-types';

type Props = {
  active: PulseTab;
  riskBadge?: number;
};

export default function PulseTabs({ active, riskBadge = 0 }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setTab = (tab: PulseTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'live') params.delete('tab');
    else params.set('tab', tab);
    const qs = params.toString();
    router.push(qs ? `/admin/pulse?${qs}` : '/admin/pulse');
  };

  return (
    <nav
      className="flex gap-1 overflow-x-auto scrollbar-thin"
      dir="rtl"
      aria-label="نمای پالس وایب"
    >
      {PULSE_TABS.map(({ id, label }) => {
        const isActive = active === id;
        const showBadge = id === 'risk' && riskBadge > 0;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx(
              'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
              isActive
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-admin-border dark:border-gray-600 text-admin-text-primary hover:bg-admin-muted dark:hover:bg-gray-700'
            )}
          >
            {label}
            {showBadge && (
              <span
                className={clsx(
                  'min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-bold flex items-center justify-center',
                  isActive ? 'bg-white/25 text-white' : 'bg-red-500 text-white'
                )}
              >
                {riskBadge > 99 ? '۹۹+' : riskBadge.toLocaleString('fa-IR')}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
