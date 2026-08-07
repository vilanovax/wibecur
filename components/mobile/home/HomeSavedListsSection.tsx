'use client';

import { useSession } from 'next-auth/react';
import { Bookmark } from 'lucide-react';
import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard, { SAVED_LIST_BADGE } from './HomeGridListCard';
import HomeFeedGrid from './HomeFeedGrid';
import { useHomeData } from '@/contexts/HomeDataContext';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { useHomeBookmarks } from '@/hooks/useHomeBookmarks';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { buildDesktopFeedCells } from '@/lib/home-feed-grid';

export default function HomeSavedListsSection() {
  const { status } = useSession();
  const { isGuest, hasSaves, isLoading: userLoading } = useHomeUserState();
  const { data: homeData } = useHomeData();
  const trendingFallback = (homeData?.trending ?? []).slice(0, 4);

  const { data: savedLists = [], isLoading } = useHomeBookmarks();

  if (status === 'loading' || userLoading) {
    return (
      <section className="mb-6">
        <div className="mb-3 px-4 lg:px-0">
          <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mx-4 h-28 animate-pulse rounded-xl bg-gray-100 lg:mx-0" />
      </section>
    );
  }

  if (isGuest) {
    return null;
  }

  const showSaved = hasSaves && savedLists.length > 0;
  const suggestionLists = trendingFallback.map((list) => ({
    id: list.id,
    title: list.title,
    slug: list.slug,
    coverImage: list.coverImage ?? '',
    saveCount: list.saveCount ?? 0,
    categories: list.categories,
  }));
  const suggestionCells = buildDesktopFeedCells(suggestionLists, {
    maxLists: 4,
    seeAll: {
      href: '/lists?mode=trending',
      label: 'مشاهده همه',
      description: 'لیست‌های ترند',
    },
  });
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
    <section className="mb-6 border-t border-wibe/50 pt-5">
      <HomeSectionTitle
        iconVariant="bookmark"
        title="ذخیره‌شده‌های تو"
        subtitle={
          showSaved ? 'آخرین لیست‌هایی که ذخیره کردی' : 'لیست‌های محبوب — با یک ذخیره شخصی‌تر می‌شود'
        }
        actionHref={showSaved ? '/profile' : '/lists?mode=trending'}
        actionLabel={showSaved ? 'همه' : 'ترندها'}
        analyticsSection="saved"
      />

      {isLoading ? (
        <div className="mx-4 h-28 animate-pulse rounded-2xl bg-wibe-surface lg:mx-0" />
      ) : showSaved ? (
        <>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide lg:hidden">
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
            <HomeFeedGrid
              cells={desktopCells}
              badge={SAVED_LIST_BADGE}
              homeSection="saved"
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide lg:hidden">
            {suggestionLists.map((list) => (
              <HomeGridListCard
                key={list.id}
                list={list}
                badge="پیشنهاد"
                badgeClassName="bg-primary/90 text-white"
                homeSection="saved"
              />
            ))}
          </div>
          <div className={`hidden lg:grid lg:px-0 ${HOME_FEED_GRID_CLASS}`}>
            <HomeFeedGrid
              cells={suggestionCells}
              badge="پیشنهاد"
              badgeClassName="bg-primary/90 text-white"
              homeSection="saved"
            />
          </div>
        </>
      )}

      {showSaved ? (
        <p className="mt-2 hidden px-4 wibe-caption text-wibe-secondary lg:block lg:px-0">
          <Bookmark className="ml-1 inline h-3.5 w-3.5 text-primary" />
          برای مدیریت کامل به پروفایل برو
        </p>
      ) : null}
    </section>
  );
}
