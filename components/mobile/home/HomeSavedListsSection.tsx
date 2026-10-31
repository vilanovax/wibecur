'use client';

import { useSession } from 'next-auth/react';
import { Bookmark } from 'lucide-react';
import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard, { SAVED_LIST_BADGE } from './HomeGridListCard';
import HomeFeedGrid from './HomeFeedGrid';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { useHomeBookmarks } from '@/hooks/useHomeBookmarks';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { buildDesktopFeedCells } from '@/lib/home-feed-grid';

/**
 * فقط وقتی کاربر واقعاً ذخیره دارد نشان داده می‌شود.
 * بدون ذخیره، ترند را به‌عنوان «ذخیره‌شده» تکرار نمی‌کنیم.
 */
export default function HomeSavedListsSection() {
  const { status } = useSession();
  const { isGuest, hasSaves, isLoading: userLoading } = useHomeUserState();
  const { data: allSavedLists = [], isLoading } = useHomeBookmarks({
    enabled: status === 'authenticated' && hasSaves,
  });
  const savedLists = allSavedLists.slice(0, 8);

  if (status === 'loading' || userLoading) {
    return (
      <section className="mb-6">
        <div className="mb-3 px-4 lg:px-0">
          <div className="h-6 w-36 animate-pulse rounded bg-muted" />
        </div>
        <div className="mx-4 h-28 animate-pulse rounded-xl bg-muted lg:mx-0" />
      </section>
    );
  }

  if (isGuest || !hasSaves) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="mb-6">
        <div className="mb-3 px-4 lg:px-0">
          <div className="h-6 w-36 animate-pulse rounded bg-muted" />
        </div>
        <div className="mx-4 h-28 animate-pulse rounded-xl bg-muted lg:mx-0" />
      </section>
    );
  }

  if (savedLists.length === 0) {
    return null;
  }

  const desktopGridLists = savedLists.map((list) => ({
    id: list.id,
    title: list.title,
    slug: list.slug,
    coverImage: list.coverImage ?? '',
    saveCount: list.saveCount ?? 0,
    categories: list.categories,
  }));
  const desktopCells = buildDesktopFeedCells(desktopGridLists, {
    maxLists: 8,
    seeAll: {
      href: '/profile',
      label: 'مشاهده همه',
      description: 'ذخیره‌شده‌های تو',
    },
  });

  return (
    <section className="mb-6">
      <HomeSectionTitle
        iconVariant="bookmark"
        title="ذخیره‌شده‌های تو"
        subtitle="آخرین لیست‌هایی که ذخیره کردی"
        actionHref="/profile"
        actionLabel="همه"
        analyticsSection="saved"
      />

      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-0.5 scrollbar-hide lg:hidden">
        {savedLists.map((list) => (
          <HomeGridListCard
            key={list.id}
            list={{
              id: list.id,
              title: list.title,
              slug: list.slug,
              coverImage: list.coverImage ?? '',
              saveCount: list.saveCount ?? 0,
              categories: list.categories,
            }}
            badge={SAVED_LIST_BADGE}
            homeSection="saved"
          />
        ))}
      </div>
      <div className={`hidden lg:grid lg:px-0 ${HOME_FEED_GRID_CLASS}`}>
        <HomeFeedGrid cells={desktopCells} badge={SAVED_LIST_BADGE} homeSection="saved" />
      </div>

      <p className="mt-2 hidden px-4 text-xs text-muted-foreground lg:block lg:px-0">
        <Bookmark className="me-1 inline size-4 text-brand" />
        برای مدیریت کامل به پروفایل برو
      </p>
    </section>
  );
}
