'use client';

import { List, Bookmark } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const myListsBadgeCount = listsCount ?? initialLists?.length ?? 0;
  const bookmarksBadgeCount = initialBookmarksTotal ?? initialBookmarks?.length ?? 0;

  const formatBadge = (n: number) => (n > 99 ? '99+' : n.toLocaleString('fa-IR'));

  return (
    <div className="mt-0 -mx-4 lg:mx-0">
      <Tabs
        value={visibleTab}
        defaultValue="my-lists"
        onValueChange={(value) => onTabChange(value as ProfileTabId)}
        variant="underline"
      >
      <div className="sticky top-14 z-20 border-b border-border bg-popover/95 px-4 backdrop-blur-sm lg:rounded-t-xl lg:border lg:border-b-0 lg:bg-popover">
        <TabsList aria-label="بخش‌های پروفایل" className="w-full">
          {VISIBLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const badge =
              tab.id === 'my-lists' && myListsBadgeCount > 0
                ? formatBadge(myListsBadgeCount)
                : tab.id === 'bookmarks' && bookmarksBadgeCount > 0
                  ? formatBadge(bookmarksBadgeCount)
                  : null;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 lg:flex-none lg:px-6">
                <Icon className="size-4" />
                {tab.label}
                {badge ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-xs font-bold text-muted-foreground">
                    {badge}
                  </span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <div className="px-0 pt-4 lg:rounded-b-xl lg:border lg:border-t-0 lg:bg-popover lg:px-4 lg:pb-4">
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
      </Tabs>
    </div>
  );
}
