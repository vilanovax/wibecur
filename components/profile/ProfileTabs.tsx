'use client';

import { useState, useRef, useEffect } from 'react';
import { List, Bookmark } from 'lucide-react';
import MyListsTab from '@/components/mobile/profile/tabs/MyListsTab';
import type { ListWithCategory } from '@/components/mobile/profile/tabs/MyListsTab';
import BookmarksTab from '@/components/mobile/profile/tabs/BookmarksTab';
import type { UserListVisibilityCounts } from '@/lib/user-lists';
import type { ProfileBookmarkSSR } from '@/lib/profile-ssr-types';

export type ProfileTabId = 'my-lists' | 'bookmarks' | 'activity';

/** تب‌های قابل نمایش — فعالیت موقتاً مخفی */
const VISIBLE_TABS: { id: Exclude<ProfileTabId, 'activity'>; label: string; icon: typeof List }[] = [
  { id: 'my-lists', label: 'لیست‌های من', icon: List },
  { id: 'bookmarks', label: 'ذخیره‌ها', icon: Bookmark },
];

interface ProfileTabsProps {
  userId: string;
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  initialLists?: ListWithCategory[];
  listsCount?: number;
  initialVisibilityCounts?: UserListVisibilityCounts;
  initialSharedCount?: number;
  initialBookmarks?: ProfileBookmarkSSR[];
  initialBookmarksTotal?: number;
}

export default function ProfileTabs({
  userId,
  activeTab,
  onTabChange,
  initialLists,
  listsCount,
  initialVisibilityCounts,
  initialSharedCount = 0,
  initialBookmarks,
  initialBookmarksTotal,
}: ProfileTabsProps) {
  const visibleTab = activeTab === 'activity' ? 'my-lists' : activeTab;
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const updateIndicator = () => {
      const i = VISIBLE_TABS.findIndex((t) => t.id === visibleTab);
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
  }, [visibleTab]);

  const myListsBadgeCount = listsCount ?? initialLists?.length ?? 0;
  const bookmarksBadgeCount = initialBookmarksTotal ?? initialBookmarks?.length ?? 0;

  const formatBadge = (n: number) => (n > 99 ? '99+' : n.toLocaleString('fa-IR'));

  return (
    <div className="mt-0 -mx-4 lg:mx-0">
      <div className="sticky top-[57px] z-20 border-b border-wibe bg-wibe-card/95 px-4 pb-0 backdrop-blur-sm lg:top-14 lg:rounded-t-xl lg:border lg:border-b-0 lg:border-wibe lg:bg-wibe-card">
        <div className="relative flex gap-1 lg:justify-start lg:gap-0">
          {VISIBLE_TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = visibleTab === tab.id;
            const badge =
              tab.id === 'my-lists' && myListsBadgeCount > 0
                ? formatBadge(myListsBadgeCount)
                : tab.id === 'bookmarks' && bookmarksBadgeCount > 0
                  ? formatBadge(bookmarksBadgeCount)
                  : null;
            return (
              <button
                key={tab.id}
                type="button"
                ref={(r) => {
                  tabRefs.current[index] = r;
                }}
                onClick={() => onTabChange(tab.id)}
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
                    className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 wibe-caption font-bold leading-none ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : tab.id === 'bookmarks'
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                          : 'bg-wibe-surface text-wibe-secondary'
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

      <div className="min-h-[calc(100vh-14rem)] border-t border-wibe/40 bg-wibe-card px-0 pt-4 lg:min-h-0 lg:rounded-b-xl lg:border lg:border-t-0 lg:border-wibe lg:px-4 lg:pb-4">
        {visibleTab === 'my-lists' && (
          <MyListsTab
            userId={userId}
            initialLists={initialLists}
            initialTotal={listsCount ?? initialLists?.length}
            initialVisibilityCounts={initialVisibilityCounts}
            initialSharedCount={initialSharedCount}
          />
        )}
        {visibleTab === 'bookmarks' && (
          <BookmarksTab
            userId={userId}
            initialBookmarks={initialBookmarks}
            initialBookmarksTotal={initialBookmarksTotal}
          />
        )}
      </div>
    </div>
  );
}
