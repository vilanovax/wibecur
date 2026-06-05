'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SETTINGS_TABS, type SettingsTab } from '@/lib/admin/settings-types';

type Props = {
  active: SettingsTab;
};

export default function SettingsTabs({ active }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setTab = (tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'integrations') params.delete('tab');
    else if (tab === 'account') params.set('tab', 'password');
    else params.set('tab', tab);
    const qs = params.toString();
    router.push(qs ? `/admin/settings?${qs}` : '/admin/settings');
  };

  return (
    <nav
      className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-thin"
      dir="rtl"
      aria-label="بخش‌های تنظیمات"
    >
      {SETTINGS_TABS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border-muted)]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
