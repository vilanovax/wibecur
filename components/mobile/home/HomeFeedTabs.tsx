'use client';

import { useState, useRef, useEffect } from 'react';
import FollowingFeed from './FollowingFeed';
import TrendingLists from './TrendingLists';

type TabId = 'foryou' | 'following' | 'trending';

const TABS: { id: TabId; label: string }[] = [
  { id: 'foryou', label: 'برای تو' },
  { id: 'following', label: 'دنبال‌شده‌ها' },
  { id: 'trending', label: 'ترند' },
];

interface HomeFeedTabsProps {
  children: React.ReactNode;
}

export default function HomeFeedTabs({ children }: HomeFeedTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('foryou');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const updateIndicator = () => {
      const i = TABS.findIndex((t) => t.id === activeTab);
      const el = tabRefs.current[i];
      if (el) setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    };
    updateIndicator();
    const t = setTimeout(updateIndicator, 50);
    return () => clearTimeout(t);
  }, [activeTab]);

  return (
    <>
      <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200/80 px-2 pt-2 pb-0">
        <div className="flex gap-1 relative">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(r) => { tabRefs.current[index] = r; }}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-t-xl text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'text-[#7C3AED] bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] rounded-full transition-all duration-300 ease-out"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
        </div>
      </div>

      {activeTab === 'foryou' && <div className="contents">{children}</div>}
      {activeTab === 'following' && (
        <div className="min-h-[40vh]">
          <FollowingFeed />
        </div>
      )}
      {activeTab === 'trending' && (
        <div className="min-h-[40vh]">
          <TrendingLists />
        </div>
      )}
    </>
  );
}
