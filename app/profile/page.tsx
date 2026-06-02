import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { requireAuth } from '@/lib/auth';
import { fetchUserLists, type UserListRecord } from '@/lib/user-lists';
import { fetchProfileUser } from '@/lib/profile-server';
import { fetchUserBookmarks } from '@/lib/user-bookmarks';
import { fetchUserActivities, type UserActivityItem } from '@/lib/user-activity';
import type { ProfileUser } from '@/components/profile/types';
import type { ProfileBookmarkSSR } from '@/lib/profile-ssr-types';
import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'پروفایل من',
  description: 'مدیریت پروفایل، لیست‌ها و فعالیت‌های شما در وایب‌کر',
  robots: { index: false, follow: false },
};

function serializeBookmarks(
  result: Awaited<ReturnType<typeof fetchUserBookmarks>>
): { bookmarks: ProfileBookmarkSSR[]; pagination: typeof result.pagination } {
  return {
    bookmarks: result.bookmarks.map((b) => ({
      id: b.id,
      createdAt:
        b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
      list: {
        ...b.list,
        updatedAt:
          b.list.updatedAt instanceof Date
            ? b.list.updatedAt.toISOString()
            : b.list.updatedAt,
      },
    })),
    pagination: result.pagination,
  };
}

function serializeActivities(activities: UserActivityItem[]) {
  return activities.map((a) => ({
    ...a,
    createdAt:
      a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
  }));
}

export default async function ProfilePage() {
  const session = await requireAuth();
  const userId = session.user.id;

  let initialUser: ProfileUser | null = null;
  let initialLists: UserListRecord[] = [];
  let initialListsTotal = 0;
  let initialBookmarks: ProfileBookmarkSSR[] = [];
  let initialBookmarksTotal = 0;
  let initialActivities: ReturnType<typeof serializeActivities> = [];

  const [profileResult, listsResult, bookmarksResult, activitiesResult] = await Promise.allSettled([
    fetchProfileUser(userId),
    fetchUserLists(userId, { page: 1, limit: 20, filter: 'all' }),
    fetchUserBookmarks(userId, { page: 1, limit: 50 }),
    fetchUserActivities(userId, { type: 'all', limit: 20 }),
  ]);

  if (profileResult.status === 'fulfilled' && profileResult.value) {
    initialUser = profileResult.value;
  } else if (profileResult.status === 'rejected') {
    console.warn('Profile SSR user fetch failed:', profileResult.reason);
  }

  if (listsResult.status === 'fulfilled') {
    initialLists = listsResult.value.lists;
    initialListsTotal = listsResult.value.pagination.total;
  } else {
    console.warn('Profile SSR lists fetch failed:', listsResult.reason);
  }

  if (bookmarksResult.status === 'fulfilled') {
    const serialized = serializeBookmarks(bookmarksResult.value);
    initialBookmarks = serialized.bookmarks;
    initialBookmarksTotal = serialized.pagination.total;
  } else {
    console.warn('Profile SSR bookmarks fetch failed:', bookmarksResult.reason);
  }

  if (activitiesResult.status === 'fulfilled') {
    initialActivities = serializeActivities(activitiesResult.value.activities);
  } else {
    console.warn('Profile SSR activity fetch failed:', activitiesResult.reason);
  }

  return (
    <div className="bg-wibe-surface">
      <Header title="پروفایل" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <main className="px-4 pt-2 lg:px-0 lg:pt-0">
        <ProfilePageClient
          userId={userId}
          initialUser={initialUser}
          initialLists={initialLists}
          initialListsTotal={initialListsTotal}
          initialBookmarks={initialBookmarks}
          initialBookmarksTotal={initialBookmarksTotal}
          initialActivities={initialActivities}
        />
      </main>
      <BottomNav />
    </div>
  );
}
