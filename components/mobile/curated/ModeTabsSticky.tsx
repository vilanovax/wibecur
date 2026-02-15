'use client';

import type { CuratedMode } from '@/types/curated';

const TABS: { value: CuratedMode; label: string; icon: string }[] = [
  { value: 'trending', label: 'ترند', icon: '🔥' },
  { value: 'popular', label: 'محبوب', icon: '⭐' },
  { value: 'new', label: 'جدید', icon: '🆕' },
  { value: 'top_curators', label: 'کیوریتورهای برتر', icon: '👑' },
  { value: 'rising', label: 'در حال رشد', icon: '🚀' },
];

interface ModeTabsStickyProps {
  value: CuratedMode;
  onChange: (mode: CuratedMode) => void;
  sticky?: boolean;
}

export default function ModeTabsSticky({
  value,
  onChange,
  sticky = true,
}: ModeTabsStickyProps) {
  const handleTab = (mode: CuratedMode) => {
    onChange(mode);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', mode);
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  return (
    <div
      className={
        sticky
          ? 'sticky top-0 z-20 bg-white border-b border-gray-100'
          : 'bg-white border-b border-gray-100'
      }
    >
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 px-4 py-3 min-w-max">
          {TABS.map((tab) => {
            const isActive = value === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTab(tab.value)}
                className={
                  isActive
                    ? 'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap bg-primary text-white shadow-sm'
                    : 'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                aria-pressed={isActive}
                aria-label={tab.label}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
