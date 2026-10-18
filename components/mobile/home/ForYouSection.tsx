'use client';

import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard from './HomeGridListCard';
import HomeFeedGrid from './HomeFeedGrid';
import {
  useForYouRecommendations,
  getForYouReasonLabel,
  type ForYouList,
} from '@/hooks/useForYouRecommendations';
import { useHomeData } from '@/contexts/HomeDataContext';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { useHomeOnboardingInterests } from '@/hooks/useHomeOnboardingInterests';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { buildDesktopFeedCells } from '@/lib/home-feed-grid';
import { selectForYouHomeLists } from '@/lib/home-list-selectors';
import { useLazyInView } from '@/hooks/useLazyInView';
import { Skeleton } from '@/components/ui/skeleton';

type ForYouSectionProps = {
  embedded?: boolean;
  /** وقتی embedded است، والد تعیین می‌کند API چه موقع fetch شود */
  fetchEnabled?: boolean;
};

export default function ForYouSection({ embedded = false, fetchEnabled: fetchEnabledProp }: ForYouSectionProps) {
  const { ref, inView } = useLazyInView({ rootMargin: '240px' });
  // Explicit fetchEnabled wins (eager home mount); else embedded waits for prop, standalone waits for inView.
  const shouldFetch =
    typeof fetchEnabledProp === 'boolean'
      ? fetchEnabledProp
      : embedded
        ? false
        : inView;

  const { hasSaves } = useHomeUserState();
  const { interests } = useHomeOnboardingInterests();
  const { data: homeData } = useHomeData();
  const { lists, isPersonalized, isLoading } = useForYouRecommendations({ enabled: shouldFetch });

  const lane = selectForYouHomeLists({
    recommendations: lists,
    trending: homeData?.trending ?? [],
    featuredId: homeData?.featured?.id,
    rising: (homeData?.rising ?? []).map((list) => ({ ...list, reasonType: 'popular' as const })),
  });
  const pool = lane.pool;
  const mobileLists = lane.mobile;
  const usingFallback = lane.usedRisingOnly;
  const waiting = (isLoading || !shouldFetch) && lists.length === 0;

  const desktopCells = buildDesktopFeedCells(pool, {
    maxLists: 8,
    seeAll: {
      href: '/lists',
      label: 'مشاهده همه',
      description: 'پیشنهادهای بیشتر',
    },
  });

  const subtitle = isPersonalized
    ? 'بر اساس ذخیره‌ها و علایق تو'
    : interests.length > 0
      ? 'بر اساس علاقه‌مندی‌های انتخاب‌شده'
      : 'لیست‌های پیشنهادی برای شروع';
  const title =
    hasSaves || interests.length > 0 || isPersonalized ? 'برای تو' : 'پیشنهاد برای شروع';

  if (waiting) {
    return (
      <section ref={ref} className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4">
            <Skeleton className="h-6 w-32" />
          </div>
        )}
        <div className="flex gap-2.5 overflow-hidden px-4 lg:hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-44 shrink-0 rounded-xl" />
          ))}
        </div>
        <div className="hidden gap-2.5 lg:grid lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (pool.length === 0) return null;

  const badgeFor = (list: { id: string }) => {
    const full = pool.find((item) => item.id === list.id) ?? list;
    return (
      getForYouReasonLabel(full as ForYouList, isPersonalized) ||
      (usingFallback ? 'پیشنهاد شروع' : null)
    );
  };

  return (
    <section ref={ref} className={embedded ? '' : 'mb-6'}>
      {!embedded && (
        <HomeSectionTitle
          iconVariant="forYou"
          title={title}
          subtitle={subtitle}
          actionHref="/lists"
          actionLabel="همه"
          analyticsSection="for_you"
        />
      )}

      {usingFallback && !hasSaves && !embedded ? (
        <p className="mb-3 px-4 wibe-caption text-muted-foreground lg:px-0">
          هنوز ذخیره‌ای نداری — این لیست‌های محبوب را امتحان کن
        </p>
      ) : null}

      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-0.5 scrollbar-hide lg:hidden">
        {mobileLists.map((list) => (
          <HomeGridListCard
            key={list.id}
            list={list}
            badge={badgeFor(list)}
            badgeClassName="max-w-32 truncate bg-brand text-brand-foreground"
            homeSection="for_you"
          />
        ))}
      </div>

      <div className={`hidden lg:grid lg:overflow-visible lg:snap-none lg:px-0 ${HOME_FEED_GRID_CLASS}`}>
        <HomeFeedGrid
          cells={desktopCells}
          getBadge={badgeFor}
          badgeClassName="bg-brand text-brand-foreground"
          homeSection="for_you"
        />
      </div>
    </section>
  );
}
