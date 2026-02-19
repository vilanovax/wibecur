'use client';

import { useState, useRef, useEffect } from 'react';
import { List, Bookmark, Clock } from 'lucide-react';
import MyListsTab from '@/components/mobile/profile/tabs/MyListsTab';
import BookmarksTab from '@/components/mobile/profile/tabs/BookmarksTab';
import RecentActivityTab from '@/components/mobile/profile/tabs/RecentActivityTab';

export type ProfileTabId = 'activity' | 'bookmarks' | 'my-lists';

const TABS: { id: ProfileTabId; label: string; icon: typeof List }[] = [
  { id: 'activity', label: 'فعالیت‌ها', icon: Clock },
  { id: 'bookmarks', label: 'ذخیره‌ها', icon: Bookmark },
  { id: 'my-lists', label: 'لیست‌های من', icon: List },
];

interface ProfileTabsProps {
  userId: string;
}

export default function ProfileTabs({ userId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('my-lists');
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
    <div className="mt-6">
      <div className="sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur border-b border-gray-200/80 -mx-4 px-4 pb-0">
        <div className="flex gap-1 relative">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(r) => {
                  tabRefs.current[index] = r;
                }}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3.5 rounded-t-xl whitespace-nowrap transition-all duration-200
                  ${isActive ? 'text-primary font-bold text-base' : 'text-gray-500 font-medium text-sm hover:text-gray-700'}
                `}
              >
                <Icon className={isActive ? 'w-5 h-5' : 'w-4 h-4'} />
                {tab.label}
              </button>
            );
          })}
          <div
            className="absolute bottom-0 h-[3px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] rounded-full transition-all duration-300 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />
        </div>
      </div>

      <div className="min-h-[400px] -mx-4">
        {activeTab === 'activity' && <RecentActivityTab userId={userId} />}
        {activeTab === 'bookmarks' && <BookmarksTab userId={userId} />}
        {activeTab === 'my-lists' && <MyListsTab userId={userId} />}
      </div>
    </div>
  );
}
