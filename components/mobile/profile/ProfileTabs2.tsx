'use client';

import { useState, useRef, useEffect } from 'react';
import { List, Lock, Bookmark, Clock } from 'lucide-react';
import MyListsTab from './tabs/MyListsTab';
import BookmarksTab from './tabs/BookmarksTab';
import LikesTab from './tabs/LikesTab';
import RecentActivityTab from './tabs/RecentActivityTab';

type TabType = 'my-lists' | 'private-lists' | 'bookmarks' | 'activity';

interface ProfileTabs2Props {
  userId: string;
}

const TABS: { id: TabType; label: string; icon: typeof List }[] = [
  { id: 'my-lists', label: 'لیست‌های من', icon: List },
  { id: 'private-lists', label: 'لیست‌های خصوصی', icon: Lock },
  { id: 'bookmarks', label: 'ذخیره‌ها', icon: Bookmark },
  { id: 'activity', label: 'فعالیت‌ها', icon: Clock },
];

export default function ProfileTabs2({ userId }: ProfileTabs2Props) {
  const [activeTab, setActiveTab] = useState<TabType>('my-lists');
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
                ref={(r) => { tabRefs.current[index] = r; }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-xl whitespace-nowrap transition-colors text-sm font-medium ${
                  isActive ? 'text-[#7C3AED]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
          <div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] rounded-full transition-all duration-300 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />
        </div>
      </div>

      <div className="min-h-[400px] -mx-4">
        {activeTab === 'my-lists' && <MyListsTab userId={userId} variant="public" />}
        {activeTab === 'private-lists' && <MyListsTab userId={userId} variant="private" />}
        {activeTab === 'bookmarks' && <BookmarksTab userId={userId} />}
        {activeTab === 'activity' && <RecentActivityTab userId={userId} />}
      </div>
    </div>
  );
}
