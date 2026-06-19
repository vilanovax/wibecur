'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard from './HomeGridListCard';
import HomeFeedGrid from './HomeFeedGrid';
import HomeStarterEmptyPanel from './HomeStarterEmptyPanel';
import { useHomeData } from '@/contexts/HomeDataContext';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { buildDesktopFeedCells } from '@/lib/home-feed-grid';

type BookmarkList = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  saveCount?: number;
  categories?: { slug?: string; icon?: string | null } | null;
};

async function fetchRecentBookmarks(): Promise<BookmarkList[]> {
  const res = await fetch('/api/user/bookmarks?page=1&limit=8');
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  const items = json.data?.bookmarks ?? [];
  return items.map((b: { list: BookmarkList }) => b.list).filter(Boolean);
}

export default function HomeSavedListsSection() {
  const { data: session, status } = useSession();
  const { isGuest, hasSaves, isLoading: userLoading } = useHomeUserState();
  const { data: homeData } = useHomeData();
  const trendingFallback = (homeData?.trending ?? []).slice(0, 4);

  const { data: savedLists = [], isLoading } = useQuery({
    queryKey: ['user', session?.user?.id, 'home-bookmarks'],
    queryFn: fetchRecentBookmarks,
    enabled: status !== 'loading' && !!session?.user?.id,
    staleTime: 60_000,
  });

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
    return (
      <section className="mb-6">
        <HomeSectionTitle
          icon="📌"
          title="ذخیره‌شده‌های تو"
          subtitle="بعد از ورود، لیست‌های ذخیره‌شده اینجا می‌آیند"
          actionHref="/login?callbackUrl=/"
          actionLabel="ورود"
        />
        <HomeStarterEmptyPanel lists={trendingFallback} isGuest variant="saved" />
      </section>
    );
  }

  const showSaved = hasSaves && savedLists.length > 0;
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
        icon="📌"
        title="ذخیره‌شده‌های تو"
        subtitle={showSaved ? 'آخرین لیست‌هایی که ذخیره کردی' : 'هنوز چیزی ذخیره نکردی'}
        actionHref={showSaved ? '/profile' : '/lists?mode=trending'}
        actionLabel={showSaved ? 'همه' : 'ترندها'}
        analyticsSection="saved"
      />

      {isLoading ? (
        <div className="mx-4 h-28 animate-pulse rounded-xl bg-gray-100 lg:mx-0" />
      ) : showSaved ? (
        <>
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
                badge="ذخیره‌شده"
                badgeClassName="bg-emerald-600/90 text-white"
                homeSection="saved"
              />
            ))}
          </div>
          <div className={`hidden lg:grid lg:px-0 ${HOME_FEED_GRID_CLASS}`}>
            <HomeFeedGrid
              cells={desktopCells}
              badge="ذخیره‌شده"
              badgeClassName="bg-emerald-600/90 text-white"
              homeSection="saved"
            />
          </div>
        </>
      ) : (
        <HomeStarterEmptyPanel lists={trendingFallback} isGuest={false} variant="saved" />
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
