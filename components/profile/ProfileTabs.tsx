'use client';

import { useState, useRef, useEffect } from 'react';
import { List, Bookmark, Clock } from 'lucide-react';
import MyListsTab from '@/components/mobile/profile/tabs/MyListsTab';
import type { ListWithCategory } from '@/components/mobile/profile/tabs/MyListsTab';
import BookmarksTab from '@/components/mobile/profile/tabs/BookmarksTab';
import ProfileActivityPanel from '@/components/profile/ProfileActivityPanel';
import type { CreatorStats, ProfileUser } from '@/components/profile/types';
import type { ProfileActivitySSR, ProfileBookmarkSSR } from '@/lib/profile-ssr-types';

export type ProfileTabId = 'my-lists' | 'bookmarks' | 'activity';

const TABS: { id: ProfileTabId; label: string; icon: typeof List }[] = [
  { id: 'my-lists', label: 'لیست‌های من', icon: List },
  { id: 'bookmarks', label: 'ذخیره‌ها', icon: Bookmark },
  { id: 'activity', label: 'فعالیت', icon: Clock },
];

interface ProfileTabsProps {
  userId: string;
  user: ProfileUser;
  creatorStats: CreatorStats;
  initialLists?: ListWithCategory[];
  listsCount?: number;
  initialBookmarks?: ProfileBookmarkSSR[];
  initialBookmarksTotal?: number;
  initialActivities?: ProfileActivitySSR[];
}

export default function ProfileTabs({
  userId,
  user,
  creatorStats,
  initialLists,
  listsCount,
  initialBookmarks,
  initialBookmarksTotal,
  initialActivities,
}: ProfileTabsProps) {
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
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);

  const myListsBadgeCount = listsCount ?? user.stats?.listsCreated ?? 0;

  return (
    <div className="mt-0 -mx-4 lg:mx-0">
      <div className="sticky top-[57px] z-20 border-b border-wibe bg-wibe-surface/95 px-4 pb-0 backdrop-blur-sm lg:top-14 lg:rounded-t-xl lg:border lg:border-b-0 lg:border-wibe lg:bg-wibe-card">
        <div className="relative flex gap-1 lg:justify-start lg:gap-0">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge =
              tab.id === 'my-lists' && myListsBadgeCount > 0
                ? myListsBadgeCount > 99
                  ? '99+'
                  : myListsBadgeCount.toLocaleString('fa-IR')
                : null;
            return (
              <button
                key={tab.id}
                type="button"
                ref={(r) => {
                  tabRefs.current[index] = r;
                }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-3 rounded-t-md whitespace-nowrap transition-all duration-200 lg:flex-none lg:px-6 lg:py-2.5 ${
                  isActive
                    ? 'text-primary font-bold wibe-small'
                    : 'text-wibe-secondary font-medium wibe-caption'
                }`}
              >
                <Icon className={isActive ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                {tab.label}
                {badge && (
                  <span
                    className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none flex items-center justify-center ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-wibe-secondary'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
          <div
            className="absolute bottom-0 h-[3px] bg-primary rounded-full transition-all duration-300 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />
        </div>
      </div>

      <div className="min-h-[240px] bg-wibe-card px-0 pt-3 lg:min-h-0 lg:rounded-b-xl lg:border lg:border-t-0 lg:border-wibe lg:px-4 lg:pb-4">
        {activeTab === 'my-lists' && (
          <MyListsTab
            userId={userId}
            initialLists={initialLists}
            initialTotal={listsCount ?? initialLists?.length}
          />
        )}
        {activeTab === 'bookmarks' && (
          <BookmarksTab
            userId={userId}
            initialBookmarks={initialBookmarks}
            initialBookmarksTotal={initialBookmarksTotal}
          />
        )}
        {activeTab === 'activity' && (
          <ProfileActivityPanel
            userId={userId}
            user={user}
            creatorStats={creatorStats}
            initialActivities={initialActivities}
          />
        )}
      </div>
    </div>
  );
}
