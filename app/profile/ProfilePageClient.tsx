'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileTabs from '@/components/profile/ProfileTabs';
import type { ProfileUser } from '@/components/profile/types';
import type { ListWithCategory } from '@/components/mobile/profile/tabs/MyListsTab';
import { LISTS_UPDATED_EVENT, PROFILE_UPDATED_EVENT } from '@/lib/profile-events';
import type { ProfileActivitySSR, ProfileBookmarkSSR } from '@/lib/profile-ssr-types';

interface ProfilePageClientProps {
  userId: string;
  initialUser?: ProfileUser | null;
  initialLists?: ListWithCategory[];
  initialListsTotal?: number;
  initialBookmarks?: ProfileBookmarkSSR[];
  initialBookmarksTotal?: number;
  initialActivities?: ProfileActivitySSR[];
}

export default function ProfilePageClient({
  userId,
  initialUser = null,
  initialLists = [],
  initialListsTotal = 0,
  initialBookmarks = [],
  initialBookmarksTotal = 0,
  initialActivities = [],
}: ProfilePageClientProps) {
  const [user, setUser] = useState<ProfileUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState('');
  const [listsTotal, setListsTotal] = useState(
    initialListsTotal || initialUser?.stats?.listsCreated || 0
  );

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

  useEffect(() => {
    void fetchProfile(Boolean(initialUser));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refetch when userId changes
  }, [userId]);

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
        <div className="overflow-hidden rounded-xl border border-wibe">
          <div className="h-14 animate-pulse bg-gray-200" />
          <div className="flex items-start gap-3 px-2.5 pb-2.5 -mt-8">
            <div className="flex-1 space-y-1.5 pt-1.5">
              <div className="h-4 w-14 rounded-full bg-gray-200" />
              <div className="h-5 w-28 rounded bg-gray-200" />
              <div className="h-3 w-16 rounded bg-gray-100" />
            </div>
            <div className="h-[68px] w-[68px] shrink-0 rounded-full border-[3px] border-white bg-gray-200" />
          </div>
          <div className="mx-2.5 mb-2.5 h-11 rounded-xl bg-gray-100" />
          <div className="grid grid-cols-4 gap-1.5 border-t border-gray-100 bg-wibe-surface/30 px-2.5 py-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[52px] animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
        <div className="h-10 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-lg text-center">
        <p className="wibe-small">{error}</p>
        <button
          type="button"
          onClick={() => fetchProfile(false)}
          className="mt-4 px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors wibe-small font-medium"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 bg-wibe-card rounded-lg border border-wibe">
        <p className="wibe-small text-wibe-secondary">کاربر یافت نشد</p>
      </div>
    );
  }

  const creatorStats = user.creatorStats ?? {
    viralListsCount: 0,
    popularListsCount: 0,
    totalLikesReceived: 0,
    profileViews: 0,
    totalItemsCurated: 0,
  };

  return (
    <div className="space-y-0 pb-4 lg:pb-2">
      <h1 className="mb-3 hidden text-xl font-bold text-foreground lg:block">پروفایل</h1>
      <div className="mb-4 overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm lg:mb-5">
        <ProfileHeader user={user} isOwner onUpdate={() => fetchProfile(true)} />
        <div className="border-t border-wibe/50 bg-wibe-surface/40 px-2.5 py-2.5 lg:px-4 lg:py-3">
          <ProfileStats creatorStats={creatorStats} listsCreated={listsTotal} />
        </div>
      </div>

      <ProfileTabs
        userId={userId}
        user={user}
        creatorStats={creatorStats}
        initialLists={initialLists}
        listsCount={listsTotal}
        initialBookmarks={initialBookmarks}
        initialBookmarksTotal={initialBookmarksTotal}
        initialActivities={initialActivities}
      />

      <div className="mt-6 border-t border-wibe pt-4 lg:hidden">
        <ProfileLogoutButton />
      </div>
    </div>
  );
}

function ProfileLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/login' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 wibe-small font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
    >
      {isLoggingOut ? (
        <span>در حال خروج…</span>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          خروج از حساب
        </>
      )}
    </button>
  );
}
