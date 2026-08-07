'use client';

import { useHomeData } from '@/contexts/HomeDataContext';
import { selectHomeTrendingLists } from '@/lib/home-list-selectors';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { padHomeFeedLists, buildDesktopFeedCells } from '@/lib/home-feed-grid';
import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard from './HomeGridListCard';
import HomeFeedGrid from './HomeFeedGrid';
import type { HomeSectionId } from '@/lib/analytics';

const MOBILE_CARD_WIDTH = 172;
const MOBILE_CARD_HEIGHT = Math.round(MOBILE_CARD_WIDTH * (5 / 4));

interface TrendingThisWeekCarouselProps {
  embedded?: boolean;
}

export default function TrendingThisWeekCarousel({ embedded = false }: TrendingThisWeekCarouselProps) {
  const { data, isLoading } = useHomeData();
  const featuredId = data?.featured?.id;
  const rising = data?.rising ?? [];
  const mobileLimit = embedded ? 12 : 8;
  const desktopLimit = 8;
  const trending = selectHomeTrendingLists(
    { trending: data?.trending ?? [], featured: data?.featured ?? null },
    { limit: Math.max(mobileLimit, desktopLimit), excludeFeatured: true }
  );

  const mobileLists = trending.slice(0, mobileLimit);
  const desktopSource = padHomeFeedLists(
    trending,
    rising,
    desktopLimit,
    featuredId ? new Set([featuredId]) : new Set()
  );
  const desktopCells = buildDesktopFeedCells(desktopSource, {
    maxLists: desktopLimit,
    seeAll: {
      href: '/lists?mode=trending',
      label: 'مشاهده همه',
      description: 'لیست‌های ترند',
    },
  });

  const lists = mobileLists;

  if (isLoading && lists.length === 0) {
    return (
      <section className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4 lg:px-0">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          </div>
        )}
        <div className={`flex gap-3 overflow-hidden px-4 lg:px-0 ${HOME_FEED_GRID_CLASS}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="shrink-0 animate-pulse rounded-2xl bg-wibe-surface lg:w-full"
              style={{ width: MOBILE_CARD_WIDTH, height: MOBILE_CARD_HEIGHT }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) {
    return embedded ? (
      <p className="px-4 py-6 text-center wibe-small text-wibe-secondary lg:px-0">
        فعلاً لیست ترندی نیست
      </p>
    ) : null;
  }

  const renderCard = (list: (typeof lists)[0]) => (
    <HomeGridListCard key={list.id} list={list} homeSection="trending" />
  );

  return (
    <section className={embedded ? 'overflow-x-hidden' : 'mb-6 overflow-x-hidden lg:mb-0'}>
      {!embedded && (
        <HomeSectionTitle
          iconVariant="trending"
          title="ترند این هفته"
          subtitle="بر اساس ذخیره و تعامل"
          actionHref="/lists?mode=trending"
          actionLabel="همه"
          analyticsSection="trending"
        />
      )}

      <div
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide lg:hidden ${HOME_FEED_GRID_CLASS}`}
      >
        {lists.map(renderCard)}
      </div>

      <div className={`hidden lg:grid lg:px-0 ${HOME_FEED_GRID_CLASS}`}>
        <HomeFeedGrid cells={desktopCells} homeSection="trending" />
      </div>
    </section>
  );
}
