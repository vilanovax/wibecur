'use client';

import { useState, useEffect, useCallback } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs, { type ProfileTabId } from '@/components/profile/ProfileTabs';
import type { ProfileUser } from '@/components/profile/types';
import type { ListWithCategory } from '@/components/mobile/profile/tabs/MyListsTab';
import { LISTS_UPDATED_EVENT, PROFILE_UPDATED_EVENT } from '@/lib/profile-events';
import type { UserListVisibilityCounts } from '@/lib/user-lists';
import type { ProfileBookmarkSSR } from '@/lib/profile-ssr-types';
import ProfileBreadcrumb from '@/components/profile/ProfileBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfilePageClientProps {
  userId: string;
  initialUser?: ProfileUser | null;
  initialLists?: ListWithCategory[];
  initialListsTotal?: number;
  initialVisibilityCounts?: UserListVisibilityCounts;
  /** SSR count for «مشترک» chip; full rows load when filter opens */
  initialSharedCount?: number;
  /** @deprecated bookmarks load on tab open */
  initialBookmarks?: ProfileBookmarkSSR[];
  /** Badge count only — full bookmarks fetch on tab open */
  initialBookmarksTotal?: number;
}

export default function ProfilePageClient({
  userId,
  initialUser = null,
  initialLists = [],
  initialListsTotal = 0,
  initialVisibilityCounts,
  initialSharedCount = 0,
  initialBookmarks = [],
  initialBookmarksTotal = 0,
}: ProfilePageClientProps) {
  const [user, setUser] = useState<ProfileUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState('');
  const [listsTotal, setListsTotal] = useState(
    initialListsTotal || initialUser?.stats?.listsCreated || 0
  );
  const [activeTab, setActiveTab] = useState<ProfileTabId>('my-lists');

  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError('');
    }
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        const nextUser = data.data.user as ProfileUser;
        setUser(nextUser);
        if (nextUser.stats?.listsCreated != null) {
          setListsTotal(nextUser.stats.listsCreated);
        }
      } else if (!silent) {
        setError(data.error || 'خطا در دریافت اطلاعات پروفایل');
      }
    } catch (err: unknown) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات پروفایل');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // SSR seed — no mount refetch (client-swr / event-driven refresh only)
  useEffect(() => {
    if (!initialUser) {
      void fetchProfile(false);
    }
  }, [userId, initialUser, fetchProfile]);

  useEffect(() => {
    const onListsUpdated = () => {
      setListsTotal((t) => t + 1);
      void fetchProfile(true);
    };
    const onProfileUpdated = () => {
      void fetchProfile(true);
    };

    window.addEventListener(LISTS_UPDATED_EVENT, onListsUpdated);
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => {
      window.removeEventListener(LISTS_UPDATED_EVENT, onListsUpdated);
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ProfileBreadcrumb />
        <Card className="bg-popover px-4 py-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-20 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </Card>
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ProfileBreadcrumb />
        <EmptyState
          title="پروفایل بارگذاری نشد"
          description={error}
          action={
            <Button type="button" variant="brand" size="lg" onClick={() => fetchProfile(false)}>
              تلاش مجدد
            </Button>
          }
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <ProfileBreadcrumb />
        <EmptyState title="کاربر یافت نشد" />
      </div>
    );
  }

  return (
    <div className="space-y-0 pb-4 lg:pb-2">
      <ProfileBreadcrumb
        currentLabel={
          user.name?.trim() ? `${user.name.trim()} (پروفایل من)` : 'پروفایل من'
        }
      />
      <h1 className="mb-3 hidden text-xl font-bold text-foreground lg:block">پروفایل</h1>
      <Card className="mb-4 overflow-hidden bg-popover lg:mb-5">
        <ProfileHeader user={user} isOwner onUpdate={() => fetchProfile(true)} />
      </Card>

      <ProfileTabs
        userId={userId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        initialLists={initialLists}
        listsCount={listsTotal}
        initialVisibilityCounts={initialVisibilityCounts}
        initialSharedCount={initialSharedCount}
        initialBookmarks={initialBookmarks}
        initialBookmarksTotal={
          initialBookmarksTotal || user.stats?.bookmarks || 0
        }
      />
    </div>
  );
}
