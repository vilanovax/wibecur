import { Suspense } from 'react';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchUserLists } from '@/lib/user-lists';
import { fetchProfileUser } from '@/lib/profile-server';
import type { ProfileUser } from '@/components/profile/types';
import type { UserListRecord } from '@/lib/user-lists';
import ProfilePageClient from './ProfilePageClient';
import ProfilePageContentSkeleton from '@/components/mobile/profile/ProfilePageContentSkeleton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'پروفایل من',
  description: 'مدیریت پروفایل، لیست‌ها و فعالیت‌های شما در وایب‌کر',
  robots: { index: false, follow: false },
};

/** Cheap count for «مشترک» chip — full shared lists load on filter open */
async function fetchSharedListsCount(userId: string): Promise<number> {
  return prisma.list_collaborators.count({
    where: {
      userId,
      status: 'ACCEPTED',
      lists: { deletedAt: null, isPublic: false },
    },
  });
}

/**
 * First paint = profile header + my-lists only.
 * Bookmarks / picks load when their tabs/sections open (client-swr / lazy).
 */
async function ProfileContent({ userId }: { userId: string }) {
  let initialUser: ProfileUser | null = null;
  let initialLists: UserListRecord[] = [];
  let initialListsTotal = 0;
  let initialVisibilityCounts = { public: 0, personal: 0 };
  let initialSharedCount = 0;

  const [profileResult, listsResult, sharedCountResult] = await Promise.allSettled([
    fetchProfileUser(userId),
    fetchUserLists(userId, { page: 1, limit: 20, filter: 'all' }),
    fetchSharedListsCount(userId),
  ]);

  if (profileResult.status === 'fulfilled' && profileResult.value) {
    initialUser = profileResult.value;
  } else if (profileResult.status === 'rejected') {
    console.warn('Profile SSR user fetch failed:', profileResult.reason);
  }

  if (listsResult.status === 'fulfilled') {
    initialLists = listsResult.value.lists;
    initialListsTotal = listsResult.value.pagination.total;
    if (listsResult.value.counts) {
      initialVisibilityCounts = listsResult.value.counts;
    }
  } else {
    console.warn('Profile SSR lists fetch failed:', listsResult.reason);
  }

  if (sharedCountResult.status === 'fulfilled') {
    initialSharedCount = sharedCountResult.value;
  }

  return (
    <ProfilePageClient
      userId={userId}
      initialUser={initialUser}
      initialLists={initialLists}
      initialListsTotal={initialListsTotal}
      initialVisibilityCounts={initialVisibilityCounts}
      initialSharedCount={initialSharedCount}
      initialBookmarksTotal={initialUser?.stats?.bookmarks ?? 0}
    />
  );
}

export default async function ProfilePage() {
  const session = await requireAuth();
  const userId = session.user.id;

  return (
    <div className="flex min-h-screen flex-col bg-wibe-card">
      <Header title="پروفایل" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <main className="px-4 pt-2 lg:px-0 lg:pt-0">
        <Suspense fallback={<ProfilePageContentSkeleton />}>
          <ProfileContent userId={userId} />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
